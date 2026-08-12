import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { digestOpencodeDb } from "../src/dream/opencode-db.js";

/**
 * OpenCode does not write JSONL at all — its real store is a single SQLite db
 * (session / message / part tables; 10.1 GB on the reference machine). The
 * configured JSONL roots never existed, so `--source opencode` scanned ZERO
 * while looking healthy. This module reads the db READ-ONLY, newest-N sessions,
 * and routes text through the same classifier as every other source.
 */
async function makeDb(
  sessions: Array<{ id: string; texts: Array<[string, string]>; updated: number }>,
) {
  const { DatabaseSync } = await import("node:sqlite");
  const dir = await mkdtemp(path.join(os.tmpdir(), "gcm-ocdb-"));
  const file = path.join(dir, "opencode.db");
  const db = new DatabaseSync(file);
  try {
    db.exec(
      "CREATE TABLE session (id TEXT PRIMARY KEY, directory TEXT, title TEXT, agent TEXT, model TEXT, cost REAL, time_created INTEGER, time_updated INTEGER)",
    );
    db.exec("CREATE TABLE message (id TEXT, session_id TEXT, data TEXT)");
    db.exec(
      "CREATE TABLE part (id TEXT, session_id TEXT, message_id TEXT, time_created INTEGER, data TEXT)",
    );
    const ins = db.prepare("INSERT INTO session VALUES (?,?,?,?,?,?,?,?)");
    const insMsg = db.prepare("INSERT INTO message VALUES (?,?,?)");
    const insPart = db.prepare("INSERT INTO part VALUES (?,?,?,?,?)");
    for (const s of sessions) {
      ins.run(
        s.id,
        "C:/dev/projects/x",
        "t",
        "build",
        JSON.stringify({ providerID: "openrouter", id: "deepseek-v4-flash" }),
        0,
        s.updated,
        s.updated,
      );
      let i = 0;
      for (const [role, text] of s.texts) {
        i += 1;
        const mid = `${s.id}-m${i}`;
        insMsg.run(mid, s.id, JSON.stringify({ role }));
        insPart.run(
          `${s.id}-p${i}`,
          s.id,
          mid,
          s.updated + i,
          JSON.stringify({ type: "text", text, message_id: mid }),
        );
      }
    }
  } finally {
    db.close();
  }
  return file;
}

describe("digestOpencodeDb", () => {
  it("digests sessions from the SQLite store with the shared classifier", async () => {
    const db = await makeDb([
      {
        id: "s1",
        updated: Date.parse("2026-08-01T00:00:00Z"),
        texts: [
          ["user", "Please remember: never commit the lockfile here."],
          ["assistant", "understood"],
        ],
      },
    ]);
    const r = await digestOpencodeDb(db, { maxSessions: 10 });
    expect(r.digests.length).toBe(1);
    const d = r.digests[0];
    expect(d?.source).toBe("opencode");
    expect(d?.nUser).toBe(1);
    expect(d?.nPreferences).toBe(1);
    expect(d?.models[0]).toContain("deepseek");
    expect(new Date(d?.sessionTs ?? 0).getUTCFullYear()).toBe(2026);
  });

  it("newest-N bound holds (session clock, not insertion order)", async () => {
    const base = Date.parse("2026-08-01T00:00:00Z");
    const db = await makeDb(
      Array.from({ length: 8 }, (_, i) => ({
        id: `s${i}`,
        updated: base + i * 1000,
        texts: [["user", `hello ${i}`]] as Array<[string, string]>,
      })),
    );
    const r = await digestOpencodeDb(db, { maxSessions: 3 });
    expect(r.digests.length).toBe(3);
    expect(r.scanned).toBe(8);
    expect(r.digests.map((d) => d.id).sort()).toEqual(["s5", "s6", "s7"]);
  });

  it("a missing db is reported, never thrown", async () => {
    const r = await digestOpencodeDb("C:/does/not/exist/opencode.db", { maxSessions: 10 });
    expect(r.digests).toEqual([]);
    expect(r.scanned).toBe(0);
    expect(r.malformed).toBe(0);
  });
});
