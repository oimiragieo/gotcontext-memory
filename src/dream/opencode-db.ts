import { statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { DigestCorpusResult, SessionDigest } from "./digest.js";
import { classifyText, emptyDigest } from "./digest.js";

/**
 * OpenCode source, done honestly: OpenCode writes NO JSONL — its store is one
 * SQLite database (session / message / part tables; 10.1 GB on the reference
 * machine). The configured JSONL roots never existed, so `--source opencode`
 * scanned zero while looking healthy in the summary.
 *
 * Read-only access, newest-N sessions by the SESSION clock (time_updated), and
 * every text part routes through the same `classifyText` as claude/codex/cursor —
 * one classifier, one scoring rule, whatever container the session arrived in.
 */

export function defaultOpencodeDbPath(): string {
  const base = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
  return path.join(base, "opencode", "opencode.db");
}

export async function digestOpencodeDb(
  dbPath: string,
  opts: { maxSessions?: number },
): Promise<DigestCorpusResult> {
  const res: DigestCorpusResult = {
    digests: [],
    scanned: 0,
    included: 0,
    excluded_permission: 0,
    truncated: 0,
    malformed: 0,
  };
  try {
    statSync(dbPath);
  } catch {
    return res; // no opencode install — an empty result, never a throw
  }
  const { DatabaseSync } = await import("node:sqlite");
  let db: InstanceType<typeof DatabaseSync>;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
  } catch {
    res.malformed += 1; // unreadable db is a counted finding, not a crash
    return res;
  }
  try {
    const total = db.prepare("SELECT COUNT(*) AS n FROM session").get() as { n: number };
    res.scanned = Number(total?.n ?? 0);
    const limit = Math.max(1, opts.maxSessions ?? 400);
    const sessions = db
      .prepare(
        "SELECT id, directory, model, time_updated FROM session ORDER BY time_updated DESC LIMIT ?",
      )
      .all(limit) as Array<{ id: string; directory: string; model: string; time_updated: number }>;

    const msgRole = db.prepare("SELECT id, data FROM message WHERE session_id = ?");
    const parts = db.prepare(
      "SELECT data FROM part WHERE session_id = ? ORDER BY time_created ASC",
    );

    for (const s of sessions) {
      try {
        const d: SessionDigest = emptyDigest(`${dbPath}#${s.id}`, { source: "opencode" });
        d.id = s.id;
        d.sessionTs = Number(s.time_updated) || 0;
        try {
          const m = JSON.parse(s.model ?? "{}") as { providerID?: string; id?: string };
          const mid = [m.providerID, m.id].filter(Boolean).join("/");
          if (mid) d.models.push(mid);
        } catch {
          // model column is optional enrichment
        }
        const roles = new Map<string, string>();
        for (const row of msgRole.all(s.id) as Array<{ id: string; data: string }>) {
          try {
            roles.set(row.id, String((JSON.parse(row.data) as { role?: string }).role ?? ""));
          } catch {
            d.malformed += 1;
          }
        }
        d.nUser = [...roles.values()].filter((r) => r === "user").length;
        d.nAssistant = [...roles.values()].filter((r) => r === "assistant").length;
        let line = 0;
        for (const row of parts.all(s.id) as Array<{ data: string }>) {
          line += 1;
          let pt: Record<string, unknown>;
          try {
            pt = JSON.parse(row.data) as Record<string, unknown>;
          } catch {
            d.malformed += 1;
            continue;
          }
          if (pt.type === "tool") {
            d.nToolUse += 1;
            const state = (pt.state ?? {}) as Record<string, unknown>;
            if (state.status === "error") {
              d.nToolError += 1;
              if (d.toolErrors.length < 60) {
                d.toolErrors.push({ line, snip: String(state.error ?? "").slice(0, 200) });
              }
            }
          } else if (pt.type === "text") {
            const isUser = roles.get(String(pt.message_id ?? "")) === "user";
            classifyText(d, String(pt.text ?? ""), line, isUser);
          }
        }
        res.digests.push(d);
        res.included += 1;
        res.malformed += 0;
      } catch {
        res.malformed += 1; // one broken session never takes the scan down
      }
    }
  } finally {
    db.close();
  }
  return res;
}
