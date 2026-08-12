import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionDigest } from "../src/dream/digest.js";
import { measureUsage } from "../src/dream/usage.js";

/**
 * Portable skill-usage telemetry (Hermes steal, adapted to a harness-agnostic
 * toolkit): usage is DERIVED from digests (skills invoked per session + session
 * clock); an optional skillsDir supplies the registry denominator so never-used
 * skills become visible. REPORT-ONLY with the never-used grace floor: a skill
 * directory younger than 14 days is too-new-to-judge — zero uses is absence of
 * evidence, not proof of disposability.
 */
function mk(id: string, ts: number, skills: string[]): SessionDigest {
  return {
    id,
    source: "claude",
    path: `/x/${id}.jsonl`,
    sessionTs: ts,
    bytes: 1,
    truncated: false,
    malformed: 0,
    nUser: 1,
    nAssistant: 1,
    nToolUse: 0,
    nToolError: 0,
    nHookBlocks: 0,
    nUserCorrections: 0,
    nPreferences: 0,
    hookBlocks: [],
    userCorrections: [],
    toolErrors: [],
    preferences: [],
    skills,
    models: ["m"],
  };
}

const NOW = Date.now();

describe("measureUsage", () => {
  it("counts sessions per skill with last_used from the session clock", () => {
    const u = measureUsage([
      mk("s1", NOW - 5 * 86_400_000, ["alpha", "beta"]),
      mk("s2", NOW - 2 * 86_400_000, ["alpha"]),
    ]);
    expect(u.skills.alpha?.sessions_used).toBe(2);
    expect(u.skills.beta?.sessions_used).toBe(1);
    expect(u.skills.alpha?.last_used_at).toBeGreaterThan(u.skills.beta?.last_used_at ?? 0);
  });

  it("with a registry dir: never-used vs too-new-to-judge (grace floor)", async () => {
    const reg = await mkdtemp(path.join(os.tmpdir(), "gcm-reg-"));
    for (const name of ["used-one", "old-unused"]) {
      await mkdir(path.join(reg, name), { recursive: true });
      await writeFile(path.join(reg, name, "SKILL.md"), "---\nname: x\n---\n", "utf8");
    }
    // age the unused one past the grace floor
    const { utimes } = await import("node:fs/promises");
    const old = new Date(NOW - 30 * 86_400_000);
    await utimes(path.join(reg, "old-unused"), old, old);

    const u = measureUsage([mk("s1", NOW - 86_400_000, ["used-one"])], reg);
    expect(u.skills["used-one"]?.state).toBe("active");
    expect(u.skills["old-unused"]?.state).toBe("never-used");
    expect(u.summary.never_used).toBe(1);
    // fresh dir = too-new-to-judge, not never-used
    await mkdir(path.join(reg, "brand-new"), { recursive: true });
    await writeFile(path.join(reg, "brand-new", "SKILL.md"), "---\nname: y\n---\n", "utf8");
    const u2 = measureUsage([mk("s1", NOW - 86_400_000, ["used-one"])], reg);
    expect(u2.skills["brand-new"]?.state).toBe("too-new-to-judge");
  });

  it("plugin-qualified invocations count for the bare name too", () => {
    const u = measureUsage([mk("s1", NOW, ["superpowers:writing-plans"])]);
    expect(u.skills["superpowers:writing-plans"]?.sessions_used).toBe(1);
    expect(u.skills["writing-plans"]?.sessions_used).toBe(1);
  });
});
