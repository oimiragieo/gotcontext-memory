import { mkdir, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { digestRoots } from "../src/dream/digest.js";

/**
 * BL-DRM-016. The streaming digest path enumerates *.jsonl only, so Cursor's
 * read-only .vscdb SQLite corpus stopped being consulted by `dream` when the digest
 * layer landed on 2026-08-09 — a coverage regression accepted at the time and
 * documented in HONESTY.md. These tests close it.
 */
async function makeVscdb(
  dir: string,
  name: string,
  bubbles: Array<{ role: string; text: string }>,
) {
  const { DatabaseSync } = await import("node:sqlite");
  const file = path.join(dir, name);
  const db = new DatabaseSync(file);
  try {
    db.exec("CREATE TABLE ItemTable (key TEXT, value TEXT)");
    const stmt = db.prepare("INSERT INTO ItemTable (key, value) VALUES (?, ?)");
    stmt.run("composerData:test", JSON.stringify({ bubbles }));
  } finally {
    db.close();
  }
  return file;
}

describe("cursor .vscdb on the digest path (BL-DRM-016)", () => {
  it("a .vscdb session produces a digest", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-vscdb-"));
    const proj = path.join(root, "proj-a");
    await mkdir(proj, { recursive: true });
    await makeVscdb(proj, "state.vscdb", [
      { role: "user", text: "Please remember: never force-push to main." },
      { role: "assistant", text: "understood" },
    ]);

    const r = await digestRoots({ roots: [root], source: "cursor" });
    expect(r.scanned).toBeGreaterThan(0);
    expect(r.digests.length).toBe(1);
    const d = r.digests[0];
    expect(d?.source).toBe("cursor");
    expect(d?.nUser).toBeGreaterThan(0);
    // the preference extractor must see .vscdb text exactly as it sees jsonl text
    expect(d?.nPreferences).toBe(1);
    expect(d?.preferences[0]?.span).toMatch(/never force-push/i);
  });

  it("jsonl and .vscdb sessions are digested together in one pass", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-vscdb2-"));
    const proj = path.join(root, "proj-b");
    await mkdir(proj, { recursive: true });
    await makeVscdb(proj, "state.vscdb", [{ role: "user", text: "hello from sqlite" }]);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      path.join(proj, "sess.jsonl"),
      `${JSON.stringify({ timestamp: "2026-01-01T00:00:00Z", message: { role: "user", content: "hello from jsonl" } })}\n`,
      "utf8",
    );

    const r = await digestRoots({ roots: [root], source: "cursor" });
    expect(r.digests.length).toBe(2);
    expect(r.included).toBe(2);
  });

  it("an unreadable .vscdb is counted, never fatal", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-vscdb3-"));
    const proj = path.join(root, "proj-c");
    await mkdir(proj, { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(path.join(proj, "broken.vscdb"), "this is not a sqlite file", "utf8");

    const r = await digestRoots({ roots: [root], source: "cursor" });
    expect(r.scanned).toBe(1);
    expect(r.malformed).toBe(1); // counted as unreadable, not thrown
    expect(r.digests.length).toBe(0);
  });
});
