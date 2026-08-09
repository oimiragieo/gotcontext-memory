import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../src/hash.js";
import { handleToolCall } from "../src/mcp/handlers.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

describe("mcp handlers", () => {
  it("stale baseHash returns CasConflict error; store unchanged", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-mcp-"));
    const store = await MemoryStore.initStore(root);
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

    const ok = await handleToolCall(store, "memory_commit", {
      path: "memory/a.md",
      body: "v2\n",
      baseHash: sha256Hex("v1\n"),
    });
    expect(ok.ok).toBe(true);
  });

  it("planted secret rejected through MCP commit", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-mcp2-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    const r = await handleToolCall(store, "memory_commit", {
      path: "memory/leak.md",
      body: "AKIAIOSFODNN7EXAMPLE\n",
      baseHash: BASE_ABSENT,
    });
    expect(r.ok).toBe(false);
    expect(await store.memoryTreeHash()).toBe(before);
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
