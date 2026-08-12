import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { SessionDigest } from "./digest.js";

/**
 * Portable skill-usage telemetry (adapted from hermes-agent's usage sidecar,
 * with the honesty rules this package holds everywhere else).
 *
 * Usage is DERIVED from session digests — skills invoked per session plus the
 * session clock — never tracked live, so it works identically across every
 * harness this toolkit ingests. An optional registry directory (of
 * `<name>/SKILL.md` folders) supplies the DENOMINATOR: without it, a skill that
 * never fires is invisible; with it, never-used skills become findings.
 *
 * REPORT-ONLY. This module never archives, never deletes, never edits a skill.
 * The never-used GRACE FLOOR (per hermes): a skill directory younger than 14
 * days is `too-new-to-judge` — zero uses is absence of evidence, not proof of
 * disposability. A mass pack install lands everything in the grace bucket, and
 * the summary says so rather than reporting a comforting zero.
 */

export type SkillUsageEntry = {
  sessions_used: number;
  last_used_at: number | null;
  state:
    | "active"
    | "stale"
    | "archive-candidate"
    | "never-used"
    | "too-new-to-judge"
    | "unregistered";
};

export type UsageReport = {
  generated_at: string;
  digests_scanned: number;
  registry_dir: string | null;
  skills: Record<string, SkillUsageEntry>;
  summary: {
    registered: number;
    active: number;
    never_used: number;
    too_new_to_judge: number;
    stale_or_archive: number;
  };
};

const DAY = 86_400_000;
export const GRACE_FLOOR_DAYS = 14;
export const STALE_DAYS = 30;
export const ARCHIVE_DAYS = 90;

function stateFor(
  count: number,
  last: number,
  ageDays: number | null,
  now: number,
): SkillUsageEntry["state"] {
  if (last && now - last < STALE_DAYS * DAY) return "active";
  if (count === 0) {
    if (ageDays !== null && ageDays < GRACE_FLOOR_DAYS) return "too-new-to-judge";
    return "never-used";
  }
  return now - last < ARCHIVE_DAYS * DAY ? "stale" : "archive-candidate";
}

export function measureUsage(digests: SessionDigest[], skillsDir?: string): UsageReport {
  const now = Date.now();
  const used = new Map<string, { count: number; last: number }>();
  const bump = (name: string, ts: number) => {
    const cur = used.get(name) ?? { count: 0, last: 0 };
    used.set(name, { count: cur.count + 1, last: Math.max(cur.last, ts) });
  };
  for (const d of digests) {
    for (const s of d.skills ?? []) {
      bump(s, d.sessionTs);
      // plugin-qualified names ("pack:skill") also count for the bare skill,
      // mirroring how harnesses dual-key their usage records
      const bare = s.includes(":") ? s.split(":", 2)[1] : null;
      if (bare) bump(bare, d.sessionTs);
    }
  }

  const skills: Record<string, SkillUsageEntry> = {};
  let registered = 0;
  if (skillsDir) {
    let names: string[] = [];
    try {
      names = readdirSync(skillsDir).filter((n) => {
        try {
          return statSync(path.join(skillsDir, n, "SKILL.md")).isFile();
        } catch {
          return false; // not a skill folder
        }
      });
    } catch {
      names = []; // unreadable registry -> derived-only report below
    }
    registered = names.length;
    for (const name of names) {
      const u = used.get(name) ?? { count: 0, last: 0 };
      let ageDays: number | null = null;
      try {
        ageDays = (now - statSync(path.join(skillsDir, name)).mtimeMs) / DAY;
      } catch {
        ageDays = null;
      }
      skills[name] = {
        sessions_used: u.count,
        last_used_at: u.last || null,
        state: stateFor(u.count, u.last, ageDays, now),
      };
    }
  }
  // invocations with no registry entry (plugin-qualified, removed skills) still
  // appear — labelled, never silently dropped
  for (const [name, u] of used) {
    if (!skills[name]) {
      skills[name] = {
        sessions_used: u.count,
        last_used_at: u.last || null,
        state: skillsDir ? "unregistered" : stateFor(u.count, u.last, null, now),
      };
    }
  }

  const states = Object.values(skills).map((e) => e.state);
  return {
    generated_at: new Date().toISOString(),
    digests_scanned: digests.length,
    registry_dir: skillsDir ?? null,
    skills,
    summary: {
      registered,
      active: states.filter((s) => s === "active").length,
      never_used: states.filter((s) => s === "never-used").length,
      too_new_to_judge: states.filter((s) => s === "too-new-to-judge").length,
      stale_or_archive: states.filter((s) => s === "stale" || s === "archive-candidate").length,
    },
  };
}
