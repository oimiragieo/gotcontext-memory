import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MARK_BEGIN } from "../src/adapters/types.js";
import { installFragments, uninstallFragments } from "../src/installer.js";
import { MemoryStore } from "../src/store.js";

describe("installer", () => {
  it("dry-run writes zero bytes; treeHash identical", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "gcm-ih-"));
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-ic-"));
    await mkdir(path.join(home, ".claude"), { recursive: true });
    await writeFile(path.join(home, ".claude", "CLAUDE.md"), "user preface\n");
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-is-"));
    const store = await MemoryStore.initStore(storeRoot);
    const before = await store.memoryTreeHash();
    const prefaceBefore = await readFile(path.join(home, ".claude", "CLAUDE.md"), "utf8");
    const { planned } = await installFragments({
      dryRun: true,
      home,
      cwd,
      storeHint: storeRoot,
      storeRoot,
    });
    expect(planned.length).toBeGreaterThan(0);
    expect(await store.memoryTreeHash()).toBe(before);
    expect(await readFile(path.join(home, ".claude", "CLAUDE.md"), "utf8")).toBe(prefaceBefore);
  });

  it("init preserves preface; uninstall restores pre-image bytes", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "gcm-ih2-"));
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-ic2-"));
    await mkdir(path.join(home, ".claude"), { recursive: true });
    await mkdir(path.join(home, ".codex"), { recursive: true });
    const preface = "user preface keep me\n";
    await writeFile(path.join(home, ".claude", "CLAUDE.md"), preface);
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-is2-"));
    const store = await MemoryStore.initStore(storeRoot);
    const before = await store.memoryTreeHash();
    const { manifest } = await installFragments({
      dryRun: false,
      home,
      cwd,
      storeHint: storeRoot,
      storeRoot,
    });
    await store.commitOperational({
      relativePath: "installer-manifest.json",
      body: `${JSON.stringify({ entries: manifest }, null, 2)}\n`,
      scanSecrets: false,
    });
    expect(await store.memoryTreeHash()).toBe(before);
    const afterInstall = await readFile(path.join(home, ".claude", "CLAUDE.md"), "utf8");
    expect(afterInstall.startsWith(preface.trim())).toBe(true);
    expect(afterInstall).toContain(MARK_BEGIN);
    // idempotent second install
    await installFragments({
      dryRun: false,
      home,
      cwd,
      storeHint: storeRoot,
      storeRoot,
    });
    const restored = await uninstallFragments({ store });
    expect(restored.length).toBeGreaterThan(0);
    expect(await readFile(path.join(home, ".claude", "CLAUDE.md"), "utf8")).toBe(preface);
  });

  it("tampered managed block refuses without --force", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "gcm-ih3-"));
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-ic3-"));
    await mkdir(path.join(home, ".claude"), { recursive: true });
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-is3-"));
    await MemoryStore.initStore(storeRoot);
    await installFragments({
      dryRun: false,
      home,
      cwd,
      storeHint: storeRoot,
      storeRoot,
    });
    const p = path.join(home, ".claude", "CLAUDE.md");
    const cur = await readFile(p, "utf8");
    await writeFile(p, cur.replace("Durable memory", "TAMPERED memory"), "utf8");
    await expect(
      installFragments({
        dryRun: false,
        home,
        cwd,
        storeHint: storeRoot,
        storeRoot,
      }),
    ).rejects.toThrow(/tampered/i);
  });

  it("re-init preImage strips prior managed block so uninstall clears markers", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "gcm-ih5-"));
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-ic5-"));
    await mkdir(path.join(home, ".claude"), { recursive: true });
    await mkdir(path.join(home, ".codex"), { recursive: true });
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-is5-"));
    const store = await MemoryStore.initStore(storeRoot);
    const first = await installFragments({
      dryRun: false,
      home,
      cwd,
      storeHint: storeRoot,
      storeRoot,
    });
    await store.commitOperational({
      relativePath: "installer-manifest.json",
      body: `${JSON.stringify({ entries: first.manifest }, null, 2)}\n`,
      scanSecrets: false,
    });
    // Simulate a second init without clearing adapter files (docker volume leftover).
    const second = await installFragments({
      dryRun: false,
      home,
      cwd,
      storeHint: storeRoot,
      storeRoot,
    });
    await store.commitOperational({
      relativePath: "installer-manifest.json",
      body: `${JSON.stringify({ entries: second.manifest }, null, 2)}\n`,
      scanSecrets: false,
    });
    const claudeEntry = second.manifest.find((e) => e.adapter === "claude-code");
    expect(claudeEntry?.preImageBase64).toBeNull();
    await uninstallFragments({ store });
    const after = await readFile(path.join(home, ".claude", "CLAUDE.md"), "utf8");
    expect(after).not.toContain(MARK_BEGIN);
  });

  it("project install skips home adapters so user CLAUDE.md is not retargeted", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "gcm-ih4-"));
    const cwdUser = await mkdtemp(path.join(os.tmpdir(), "gcm-ic4u-"));
    const cwdProj = await mkdtemp(path.join(os.tmpdir(), "gcm-ic4p-"));
    await mkdir(path.join(home, ".claude"), { recursive: true });
    await mkdir(path.join(home, ".codex"), { recursive: true });
    const userStore = await mkdtemp(path.join(os.tmpdir(), "gcm-isu-"));
    const projStore = path.join(cwdProj, ".gotcontext");
    await MemoryStore.initStore(userStore);
    await installFragments({
      dryRun: false,
      home,
      cwd: cwdUser,
      storeHint: userStore,
      storeRoot: userStore,
    });
    const claudeBefore = await readFile(path.join(home, ".claude", "CLAUDE.md"), "utf8");
    expect(claudeBefore).toContain(userStore);
    await MemoryStore.initStore(projStore);
    const { planned } = await installFragments({
      dryRun: false,
      home,
      cwd: cwdProj,
      storeHint: projStore,
      storeRoot: projStore,
      skipHomeAdapters: true,
    });
    expect(planned.some((p) => p.startsWith("claude-code:") || p.startsWith("codex:"))).toBe(false);
    expect(planned.some((p) => p.startsWith("agy:") || p.startsWith("cursor:"))).toBe(true);
    expect(await readFile(path.join(home, ".claude", "CLAUDE.md"), "utf8")).toBe(claudeBefore);
    const agents = await readFile(path.join(cwdProj, "AGENTS.md"), "utf8");
    expect(agents).toContain(projStore);
  });

  it("fragment parity: shared constraint sentences in all five renders", async () => {
    const { adapters } = await import("../src/adapters/types.js");
    const renders = adapters.map((a) => a.render("/tmp/store"));
    const must = ["Do not silently rewrite memory", "Writes must go through", "MEMORY.md index"];
    for (const sentence of must) {
      for (const r of renders) {
        expect(r).toContain(sentence);
      }
    }
  });
});
