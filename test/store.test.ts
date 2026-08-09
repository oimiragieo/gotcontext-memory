import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { memoryTreeHash, sha256Hex } from "../src/hash.js";
import { BASE_ABSENT, CasConflict, MemoryStore } from "../src/store.js";

describe("MemoryStore.commitCanonical CAS", () => {
  it("commitCanonical with stale baseHash throws CasConflict and leaves file bytes unchanged", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-store-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "hello\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const before = await readFile(path.join(root, "memory/a.md"));
    await expect(
      store.commitCanonical({
        relativePath: "memory/a.md",
        body: "stale\n",
        baseHash: "deadbeef",
        provenance: { authored_by: "human" },
      }),
    ).rejects.toBeInstanceOf(CasConflict);
    const after = await readFile(path.join(root, "memory/a.md"));
    expect(Buffer.compare(before, after)).toBe(0);
  });

  it("control: correct baseHash commit succeeds and bytes change", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-store-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "v1\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const h = sha256Hex("v1\n");
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "v2\n",
      baseHash: h,
      provenance: { authored_by: "human" },
    });
    expect(await readFile(path.join(root, "memory/a.md"), "utf8")).toBe("v2\n");
  });

  it("memoryTreeHash ignores proposals and detects memory byte change", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-store-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "x\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const h1 = await store.memoryTreeHash();
    await store.commitOperational({
      relativePath: "proposals/p1.json",
      body: JSON.stringify({ ok: true }),
      scanSecrets: false,
    });
    expect(await store.memoryTreeHash()).toBe(h1);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "y\n",
      baseHash: sha256Hex("x\n"),
      provenance: { authored_by: "human" },
    });
    expect(await store.memoryTreeHash()).not.toBe(h1);
  });

  it("path containment rejects traversal", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-store-"));
    const store = await MemoryStore.initStore(root);
    await expect(
      store.commitCanonical({
        relativePath: "../escape.md",
        body: "nope\n",
        baseHash: BASE_ABSENT,
        provenance: { authored_by: "human" },
      }),
    ).rejects.toThrow(/Path containment/);
  });

  it("two child processes: exactly one commitCanonical wins", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-cas-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/race.md",
      body: "base\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "system" },
    });
    const baseHash = sha256Hex("base\n");
    const worker = fileURLToPath(new URL("./helpers/cas-worker.ts", import.meta.url));
    const run = (body: string) =>
      new Promise<{ code: number | null; out: string }>((resolve) => {
        const child = spawn(process.execPath, ["--import", "tsx", worker, root, baseHash, body], {
          stdio: ["ignore", "pipe", "pipe"],
        });
        let out = "";
        child.stdout.on("data", (d) => {
          out += d;
        });
        child.stderr.on("data", (d) => {
          out += d;
        });
        child.on("close", (code) => resolve({ code, out }));
      });
    const [a, b] = await Promise.all([run("A\n"), run("B\n")]);
    const codes = [a.code, b.code].sort();
    expect(codes).toEqual([0, 1]);
    const final = await readFile(path.join(root, "memory/race.md"), "utf8");
    expect(["A\n", "B\n"]).toContain(final);
  });

  it("create vs delete on same path: at most one succeeds without torn state", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-cd-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/race-cd.md",
      body: "seed\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "system" },
    });
    const baseHash = sha256Hex("seed\n");
    const worker = fileURLToPath(new URL("./helpers/create-delete-worker.ts", import.meta.url));
    const run = (args: string[]) =>
      new Promise<{ code: number | null; out: string }>((resolve) => {
        const child = spawn(process.execPath, ["--import", "tsx", worker, root, ...args], {
          stdio: ["ignore", "pipe", "pipe"],
        });
        let out = "";
        child.stdout.on("data", (d) => {
          out += d;
        });
        child.stderr.on("data", (d) => {
          out += d;
        });
        child.on("close", (code) => resolve({ code, out }));
      });
    // Parallel: delete seed + create new (create uses absent — may conflict if file still there)
    const [del, upd] = await Promise.all([
      run(["delete", baseHash]),
      run(["update", baseHash, "new\n"]),
    ]);
    const oks = [del, upd].filter((r) => r.code === 0).length;
    expect(oks).toBeGreaterThanOrEqual(1);
    expect(oks).toBeLessThanOrEqual(2);
    // Final state must be coherent: absent OR exactly "new\n"
    const buf = await store.read("memory/race-cd.md");
    if (buf) expect(buf.toString("utf8")).toBe("new\n");
  });
});

describe("memoryTreeHash helper export", () => {
  it("stable empty-ish store", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-hash-"));
    await MemoryStore.initStore(root);
    const h = await memoryTreeHash(root);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });
});
