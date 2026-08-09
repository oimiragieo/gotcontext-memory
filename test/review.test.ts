import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { acceptProposal } from "../src/review.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

async function writeProposal(store: MemoryStore, id: string, body: object) {
  await store.commitOperational({
    relativePath: `proposals/${id}.json`,
    body: JSON.stringify(body, null, 2),
    scanSecrets: false,
  });
}

describe("review accept", () => {
  it("rejects unknown action before mutation", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-rev-act-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    await writeProposal(store, "noop1", {
      id: "noop1",
      action: "noop",
      targetPath: "memory/x.md",
      base_hash: "absent",
      body: "x\n",
      evidence: [],
      createdAt: new Date().toISOString(),
    });
    await expect(acceptProposal(store, "noop1")).rejects.toThrow(/unknown action/);
    expect(await store.memoryTreeHash()).toBe(before);
  });

  it("rejects invalid expiresAt", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-rev-exp-"));
    const store = await MemoryStore.initStore(root);
    await writeProposal(store, "badexp", {
      id: "badexp",
      action: "create",
      targetPath: "memory/x.md",
      base_hash: "absent",
      body: "x\n",
      evidence: [],
      createdAt: new Date().toISOString(),
      expiresAt: "not-a-date",
    });
    await expect(acceptProposal(store, "badexp")).rejects.toThrow(/expiresAt invalid/);
  });

  it("concurrent accepts of disjoint creates both land in MEMORY.md", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-rev-conc-"));
    const store = await MemoryStore.initStore(root);
    for (const [id, rel] of [
      ["p-a", "memory/a.md"],
      ["p-b", "memory/b.md"],
    ] as const) {
      await writeProposal(store, id, {
        id,
        action: "create",
        targetPath: rel,
        base_hash: "absent",
        body: `---\ntitle: ${id}\ndescription: d\n---\n\nbody-${id}\n`,
        evidence: [{ transcriptId: "t", quote: "q" }],
        createdAt: new Date().toISOString(),
      });
    }
    const worker = fileURLToPath(new URL("./helpers/accept-worker.ts", import.meta.url));
    const run = (id: string) =>
      new Promise<{ code: number | null; out: string }>((resolve) => {
        const child = spawn(process.execPath, ["--import", "tsx", worker, root, id], {
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
    const [a, b] = await Promise.all([run("p-a"), run("p-b")]);
    // Both should succeed under stable locks + index rebuild under lock
    expect([a.code, b.code].sort()).toEqual([0, 0]);
    const index = (await store.read("MEMORY.md"))?.toString("utf8") ?? "";
    expect(index).toContain("memory/a.md");
    expect(index).toContain("memory/b.md");
    expect(await store.read("memory/a.md")).not.toBeNull();
    expect(await store.read("memory/b.md")).not.toBeNull();
  });
});
