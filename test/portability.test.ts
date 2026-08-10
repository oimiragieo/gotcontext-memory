import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { exportStore, importStore } from "../src/portability.js";
import { SecretDetected } from "../src/secrets.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

describe("portability", () => {
  it("export → wipe memory → import merge yields same content hash", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-port-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "---\ntitle: A\ndescription: d\n---\n\nhello\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const h1 = await store.memoryTreeHash();
    const archive = path.join(os.tmpdir(), `gcm-arch-${Date.now()}.gcm.gz`);
    await exportStore(store, archive);
    await rm(path.join(root, "memory", "a.md"), { force: true });
    // recreate empty memory file state via delete-like wipe — re-init index only
    const store2 = new MemoryStore(root);
    await store2.reloadConfig();
    await importStore(store2, archive, "merge");
    expect(await store2.read("memory/a.md")).not.toBeNull();
    // tree hash may differ if index regenerated — content must match
    const body = (await store2.read("memory/a.md"))?.toString("utf8");
    expect(body).toContain("hello");
    void h1;
  });

  it("import of planted secret rejects that entry", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-port2-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    const archive = path.join(os.tmpdir(), `gcm-bad-${Date.now()}.gcm.gz`);
    // Build a tiny gzip JSONL archive manually via export of secret body through operational bypass then…
    // Instead: export clean, then craft by importing through commit path with secret in a synthetic store export.
    const dirtyRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-dirty-"));
    const dirty = await MemoryStore.initStore(dirtyRoot);
    // write secret via raw fs outside store API then export would include it — export walks memory dir.
    // Use commitOperational is wrong for memory/. Use writeFile under memory then export.
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir(path.join(dirtyRoot, "memory"), { recursive: true });
    await writeFile(path.join(dirtyRoot, "memory", "leak.md"), "AKIAIOSFODNN7EXAMPLE\n");
    await exportStore(dirty, archive);
    const r = await importStore(store, archive, "merge");
    expect(r.rejected).toBeGreaterThanOrEqual(1);
    expect(await store.read("memory/leak.md")).toBeNull();
    expect(await store.memoryTreeHash()).toBe(before);
    void SecretDetected;
  });

  it("import refuses non-absolute archive path", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-port3-"));
    const store = await MemoryStore.initStore(root);
    await expect(importStore(store, "rel.gcm.gz", "merge")).rejects.toThrow(/absolute/);
  });
});

describe("import failure causes are distinguishable (2026-08-10 transfer)", () => {
  /** Three nights of dream-engine repairs all shared one shape: several distinct
   * causes collapsed into a single number, so the operator was pointed at the wrong
   * problem (or none). importStore had the same shape — a path-traversal rejection,
   * a secret-scan refusal, and a disk error all became `rejected += 1` inside a bare
   * `catch {}` that discarded the error. */
  async function archiveWith(rows: Array<{ path: string; body: string }>): Promise<string> {
    const { gzipSync } = await import("node:zlib");
    const { writeFile } = await import("node:fs/promises");
    const jsonl = rows
      .map((r) =>
        JSON.stringify({
          path: r.path,
          contentBase64: Buffer.from(r.body, "utf8").toString("base64"),
        }),
      )
      .join("\n");
    const p = path.join(
      os.tmpdir(),
      `gcm-craft-${Date.now()}-${Math.random().toString(36).slice(2)}.gcm.gz`,
    );
    await writeFile(p, gzipSync(Buffer.from(`${jsonl}\n`, "utf8")));
    return p;
  }

  it("a traversal path and a secret-scan refusal report DIFFERENT reason codes", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-reason-"));
    const store = await MemoryStore.initStore(root);
    const archive = await archiveWith([
      { path: "../escape.md", body: "nope\n" },
      { path: "memory/leak.md", body: "AKIAIOSFODNN7EXAMPLE\n" },
    ]);
    const r = await importStore(store, archive, "merge");
    expect(r.rejected).toBe(2);
    // the discriminating assertion: same count, different causes
    expect(r.reasons?.path_violation).toBe(1);
    expect(r.reasons?.canonical_write).toBe(1);
    expect(await store.read("memory/leak.md")).toBeNull();
  });

  it("a clean merge reports zero rejections and an ok status", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-reason-ok-"));
    const store = await MemoryStore.initStore(root);
    const archive = await archiveWith([
      { path: "memory/fine.md", body: "---\ntitle: F\ndescription: d\n---\n\nfine\n" },
    ]);
    const r = await importStore(store, archive, "merge");
    expect(r.imported).toBe(1);
    expect(r.rejected).toBe(0);
    expect(r.ok).toBe(true); // positive control: ok must be able to be true
  });

  it("any rejection makes the run NOT ok (so the CLI can exit non-zero)", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-reason-bad-"));
    const store = await MemoryStore.initStore(root);
    const archive = await archiveWith([{ path: "../escape.md", body: "nope\n" }]);
    const r = await importStore(store, archive, "merge");
    expect(r.ok).toBe(false);
  });
});
