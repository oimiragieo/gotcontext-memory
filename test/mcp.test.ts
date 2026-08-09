import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../src/hash.js";
import { handleToolCall, listMcpTools } from "../src/mcp/handlers.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

describe("mcp handlers", () => {
  it("default: memory_commit refused; memory_propose works", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-mcp-off-"));
    const store = await MemoryStore.initStore(root);
    const tools = await listMcpTools(store);
    expect(tools.some((t) => t.name === "memory_commit")).toBe(false);
    expect(tools.some((t) => t.name === "memory_propose")).toBe(true);
    const before = await store.memoryTreeHash();
    const denied = await handleToolCall(store, "memory_commit", {
      path: "memory/a.md",
      body: "x\n",
      baseHash: BASE_ABSENT,
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.message).toMatch(/allowCommit/);
    expect(await store.memoryTreeHash()).toBe(before);
    const proposed = await handleToolCall(store, "memory_propose", {
      path: "memory/a.md",
      body: "---\ntitle: A\ndescription: d\n---\n\nx\n",
    });
    expect(proposed.ok).toBe(true);
    expect(await store.memoryTreeHash()).toBe(before);
  });

  it("memory_read refuses installer-manifest and allows memory/**", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-mcp-read-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "hello\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const bad = await handleToolCall(store, "memory_read", {
      path: "installer-manifest.json",
    });
    expect(bad.ok).toBe(false);
    const ok = await handleToolCall(store, "memory_read", { path: "memory/a.md" });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      const text = (ok.result as { content: Array<{ text: string }> }).content[0]?.text;
      expect(text).toBe("hello\n");
    }
  });

  it("allowCommit true: stale baseHash CasConflict; secrets rejected; clean commit ok", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-mcp-"));
    const store = await MemoryStore.initStore(root);
    await writeFile(
      path.join(root, "config.json"),
      `${JSON.stringify({
        dream: { enabled: false, policy: {} },
        memory: { policy: {} },
        secrets: { allowlist: [] },
        mcp: { allowCommit: true },
      })}\n`,
    );
    await store.reloadConfig();
    const tools = await listMcpTools(store);
    expect(tools.some((t) => t.name === "memory_commit")).toBe(true);

    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "v1\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const before = await store.memoryTreeHash();
    const stale = await handleToolCall(store, "memory_commit", {
      path: "memory/a.md",
      body: "stale\n",
      baseHash: "deadbeef",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.message).toMatch(/CasConflict/);
    expect(await store.memoryTreeHash()).toBe(before);

    const secret = await handleToolCall(store, "memory_commit", {
      path: "memory/leak.md",
      body: "AKIAIOSFODNN7EXAMPLE\n",
      baseHash: BASE_ABSENT,
    });
    expect(secret.ok).toBe(false);
    expect(await store.memoryTreeHash()).toBe(before);

    const ok = await handleToolCall(store, "memory_commit", {
      path: "memory/a.md",
      body: "v2\n",
      baseHash: sha256Hex("v1\n"),
    });
    expect(ok.ok).toBe(true);
  });

  it("memory_search does not write", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-mcp3-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    const r = await handleToolCall(store, "memory_search", {});
    expect(r.ok).toBe(true);
    expect(await store.memoryTreeHash()).toBe(before);
  });
});
