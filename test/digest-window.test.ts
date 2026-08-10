import { describe, expect, it } from "vitest";
import { type SessionDigest, selectDigests } from "../src/dream/digest.js";

/**
 * L9, ported from the Python engine (fixed there 2026-08-09, never ported here):
 * a newest-N window silently COLLAPSES in calendar time as volume grows. On the
 * reference workstation, "newest 400" spanned under one day, so a pattern recurring
 * twice a week could never reach a prevalence threshold — not absent, unobservable.
 * Stratified selection keeps recency dominant while sampling older strata so the
 * window spans real time. Deterministic: no RNG, same corpus → same selection.
 */
function mk(id: number, ts: number): SessionDigest {
  return {
    id: `s${id}`,
    source: "claude",
    path: `/x/s${id}.jsonl`,
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
    skills: [],
    models: [],
  };
}

const DAY = 86_400_000;
const T0 = Date.parse("2026-01-01T00:00:00Z");

describe("selectDigests (stratified window)", () => {
  it("returns everything when under the limit", () => {
    const all = Array.from({ length: 10 }, (_, i) => mk(i, T0 + i * DAY));
    expect(selectDigests(all, 40).length).toBe(10);
  });

  it("spans the full corpus age instead of collapsing to the newest burst", () => {
    // 30 days of history, then a burst of 300 sessions in the last day —
    // the shape of a busy workstation. Newest-N would select ONLY the burst.
    const old = Array.from({ length: 60 }, (_, i) => mk(i, T0 + i * (DAY / 2)));
    const burst = Array.from({ length: 300 }, (_, i) => mk(1000 + i, T0 + 30 * DAY + i * 60_000));
    const sel = selectDigests([...burst, ...old], 40);

    expect(sel.length).toBe(40);
    const ts = sel.map((d) => d.sessionTs);
    const spanDays = (Math.max(...ts) - Math.min(...ts)) / DAY;
    // the discriminating assertion: newest-40 here spans <1 day; stratified must
    // reach deep into the older strata
    expect(spanDays).toBeGreaterThan(20);
    // recency still dominates: at least half the picks come from the burst
    expect(sel.filter((d) => d.sessionTs >= T0 + 30 * DAY).length).toBeGreaterThanOrEqual(20);
  });

  it("is deterministic and returns no duplicates", () => {
    const all = Array.from({ length: 500 }, (_, i) => mk(i, T0 + i * 3_600_000));
    const a = selectDigests(all, 40).map((d) => d.id);
    const b = selectDigests(all, 40).map((d) => d.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });
});
