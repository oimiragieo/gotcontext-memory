import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CorpusSource, ScanOpts, ScanResult, Transcript } from "./types.js";
import { corpusScanLabel } from "./types.js";

/**
 * Cursor corpus:
 * 1) Prefer fixture-pinned `*.vscdb` / `state.vscdb` via read-only `node:sqlite`
 * 2) Also accept Cursor JSONL under roots (migration / non-sqlite fixtures)
 */
export const cursorCorpus: CorpusSource = {
  name: "cursor",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const { readdir } = await import("node:fs/promises");
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      const files: string[] = [];
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else if (
              e.name.endsWith(".jsonl") ||
              e.name.endsWith(".vscdb") ||
              e.name === "state.vscdb"
            ) {
              files.push(abs);
            }
          }
        };
        await walk(root);
      } catch (err) {
        errors.push({ path: root, message: (err as Error).message });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (opts.scope === "project" && opts.projectKey && projectKey !== opts.projectKey) {
          excluded += 1;
          continue;
        }
        try {
          if (file.endsWith(".vscdb")) {
            const turns = await readVscdbTurns(file);
            transcripts.push({
              id: path.basename(file, ".vscdb"),
              source: "cursor",
              path: file,
              scope: opts.scope,
              projectKey,
              turns,
            });
            continue;
          }
          const raw = await readFile(file, "utf8");
          const turns = [];
          for (const line of raw.split(/\r?\n/).filter(Boolean)) {
            const obj = JSON.parse(line) as {
              message?: { role?: string; content?: unknown };
              role?: string;
              text?: string;
            };
            if (obj.message) {
              const content = obj.message.content;
              turns.push({
                role: String(obj.message.role ?? "user"),
                text: typeof content === "string" ? content : JSON.stringify(content ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            } else {
              turns.push({
                role: String(obj.role ?? "user"),
                text: String(obj.text ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            }
          }
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "cursor",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }
    return {
      transcripts,
      scanned,
      included: transcripts.length,
      excluded_permission: excluded,
      malformed,
      errors,
      label: corpusScanLabel(scanned, transcripts.length),
    };
  },
};

/** Fixture schema: ItemTable key `composerData:<id>` → JSON { bubbles: [{type,text}] } */
async function readVscdbTurns(dbPath: string) {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rows = db
      .prepare(
        `SELECT key, value FROM ItemTable WHERE key LIKE 'composerData:%' OR key LIKE 'bubbleId:%'`,
      )
      .all() as Array<{ key: string; value: string | Buffer }>;
    const turns: Array<{
      role: string;
      text: string;
      tool_events: [];
      skill_invocations: [];
    }> = [];
    for (const row of rows) {
      const raw =
        typeof row.value === "string" ? row.value : Buffer.from(row.value).toString("utf8");
      try {
        const parsed = JSON.parse(raw) as {
          bubbles?: Array<{ type?: string; text?: string; role?: string }>;
          type?: string;
          text?: string;
          role?: string;
        };
        if (Array.isArray(parsed.bubbles)) {
          for (const b of parsed.bubbles) {
            turns.push({
              role: String(b.role ?? (b.type === "ai" ? "assistant" : "user")),
              text: String(b.text ?? ""),
              tool_events: [],
              skill_invocations: [],
            });
          }
        } else if (parsed.text) {
          turns.push({
            role: String(parsed.role ?? "user"),
            text: String(parsed.text),
            tool_events: [],
            skill_invocations: [],
          });
        }
      } catch {
        /* skip non-json cells */
      }
    }
    return turns;
  } finally {
    db.close();
  }
}
