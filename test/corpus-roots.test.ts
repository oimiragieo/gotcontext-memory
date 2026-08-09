import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { defaultCorpusRoots } from "../src/corpus/roots.js";

describe("defaultCorpusRoots", () => {
  const home = "/tmp/gcm-home-roots";
  const cwd = "/tmp/gcm-cwd-roots";

  it("claude → ~/.claude/projects", () => {
    expect(defaultCorpusRoots("claude", { home, cwd })).toEqual([
      path.join(home, ".claude", "projects"),
    ]);
  });

  it("codex → sessions + projects under ~/.codex", () => {
    expect(defaultCorpusRoots("codex", { home, cwd })).toEqual([
      path.join(home, ".codex", "sessions"),
      path.join(home, ".codex", "projects"),
    ]);
  });

  it("cursor → ~/.cursor/projects + cwd/.cursor", () => {
    expect(defaultCorpusRoots("cursor", { home, cwd })).toEqual([
      path.join(home, ".cursor", "projects"),
      path.join(cwd, ".cursor"),
    ]);
  });

  it("defaults home/cwd to process values", () => {
    const roots = defaultCorpusRoots("claude");
    expect(roots[0]).toBe(path.join(os.homedir(), ".claude", "projects"));
  });
});
