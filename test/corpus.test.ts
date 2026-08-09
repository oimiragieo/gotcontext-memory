import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { agyCorpus } from "../src/corpus/agy.js";
import { claudeCorpus } from "../src/corpus/claude.js";
import { codexCorpus } from "../src/corpus/codex.js";
import { cursorCorpus } from "../src/corpus/cursor.js";
import { opencodeCorpus } from "../src/corpus/opencode.js";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/transcripts");

describe("corpus importers", () => {
  it("claude: empty dir → EMPTY label", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-empty-"));
    const r = await claudeCorpus.scan({ scope: "user", roots: [root] });
    expect(r.label).toBe("EMPTY");
    expect(r.scanned).toBe(0);
  });

  it("claude: two sessions + malformed sibling", async () => {
    const r = await claudeCorpus.scan({
      scope: "user",
      roots: [path.join(FIX, "claude")],
    });
    expect(r.scanned).toBeGreaterThanOrEqual(3);
    expect(r.included).toBe(2);
    expect(r.malformed).toBeGreaterThanOrEqual(1);
    expect(r.transcripts).toHaveLength(2);
    const withSkill = r.transcripts.find((t) => t.id === "s1");
    expect(withSkill?.turns.some((t) => t.skill_invocations?.length)).toBe(true);
  });

  it("claude CE-8 scope: projectKey filters", async () => {
    const r = await claudeCorpus.scan({
      scope: "project",
      projectKey: "proj-a",
      roots: [path.join(FIX, "claude")],
    });
    expect(r.included + r.excluded_permission + r.malformed).toBe(r.scanned);
    expect(r.included).toBeGreaterThanOrEqual(1);
  });

  it("codex: positive two sessions", async () => {
    const r = await codexCorpus.scan({
      scope: "user",
      roots: [path.join(FIX, "codex")],
    });
    expect(r.included).toBe(2);
    expect(r.label).toBe("OK");
    expect(r.transcripts[0]?.source).toBe("codex");
  });

  it("cursor: jsonl + vscdb sqlite fixture", async () => {
    const r = await cursorCorpus.scan({
      scope: "user",
      roots: [path.join(FIX, "cursor")],
    });
    expect(r.included).toBeGreaterThanOrEqual(2);
    const sqlite = r.transcripts.find((t) => t.path.endsWith(".vscdb"));
    expect(sqlite).toBeTruthy();
    expect(sqlite?.turns.length).toBeGreaterThanOrEqual(1);
  });

  it("agy/opencode stubs: PARTIAL label + candidate enumeration", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-stub-"));
    await mkdir(path.join(root, "x"), { recursive: true });
    await writeFile(path.join(root, "x", "a.log"), "hi");
    for (const src of [agyCorpus, opencodeCorpus]) {
      const r = await src.scan({ scope: "user", roots: [root] });
      expect(r.label).toMatch(/PARTIAL/);
      expect(r.scanned).toBeGreaterThanOrEqual(1);
      expect(r.transcripts).toEqual([]);
    }
  });
});
