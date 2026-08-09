import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, validateConfigObject } from "../src/config.js";
import { resolveStoreRoot } from "../src/paths.js";

describe("config + store tiers", () => {
  it("rejects unknown and schedule/auto keys by name", () => {
    expect(() => validateConfigObject({ foo: 1 })).toThrow(/Unknown config key: foo/);
    expect(() => validateConfigObject({ dream: { enabled: false, schedule: "1h" } })).toThrow(
      /Forbidden/,
    );
    expect(() => validateConfigObject({ dream: { enabled: false, auto: true } })).toThrow(
      /Forbidden/,
    );
  });

  it("default dream.enabled is false (never unprompted)", () => {
    expect(DEFAULT_CONFIG.dream.enabled).toBe(false);
    expect(DEFAULT_CONFIG.mcp.allowCommit).toBe(false);
  });

  it("accepts mcp.allowCommit opt-in", () => {
    const cfg = validateConfigObject({
      dream: { enabled: false },
      mcp: { allowCommit: true },
    });
    expect(cfg.mcp.allowCommit).toBe(true);
  });

  it("ambiguous store refuses with valid options", () => {
    expect(() => resolveStoreRoot({ projectExists: true })).toThrow(
      /Ambiguous store.*--store user \| --store project/,
    );
  });

  it("project tier missing refuses with valid options", () => {
    expect(() => resolveStoreRoot({ tier: "project", projectExists: false })).toThrow(
      /Project store not present/,
    );
  });

  it("user tier resolves under home", async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), "gcm-home-"));
    const root = resolveStoreRoot({
      tier: "user",
      home,
      projectExists: false,
    });
    expect(root).toBe(path.join(home, ".gotcontext"));
  });
});
