import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionDigest } from "../src/dream/digest.js";
import { measureEfficacy } from "../src/dream/efficacy.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

/**
 * The efficacy loop: the difference between a system that WRITES memory and one
 * that LEARNS. An accepted pattern-note claims "this recurs — remember it so it
 * stops." Nothing previously ever checked whether it stopped. measureEfficacy
 * re-runs the prevalence count for each accepted pattern key over sessions AFTER
 * acceptance and renders a verdict — with the same honesty rules as everything
 * else here: counted, never inferred; a thin window is INSUFFICIENT_DATA, not a
 * verdict.
 */
const DAY = 86_400_000;
const T0 = Date.parse("2026-03-01T00:00:00Z");

function mk(id: string, ts: number, toolErrSnips: string[]): SessionDigest {
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
    nToolError: toolErrSnips.length,
    nHookBlocks: 0,
    nUserCorrections: 0,
    nPreferences: 0,
    hookBlocks: [],
    userCorrections: [],
    toolErrors: toolErrSnips.map((s, i) => ({ line: i + 1, snip: s })),
    preferences: [],
    skills: [],
    models: [],
  };
}

async function storeWithPatternNote(kind: string, key: string, acceptedAtIso: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), "gcm-eff-"));
  const store = await MemoryStore.initStore(root);
  // the exact body shape proposalsFromPatterns emits
  const body =
    `---\ntitle: Recurring ${kind.replace(/_/g, " ")}\n` +
    `description: ${JSON.stringify(`seen in 3/10 sessions — ${key}`)}\ncreatedAt: ${acceptedAtIso}\n---\n\n` +
    `**Pattern:** ${key}\n\n**Prevalence:** 3/10 sessions (4 occurrences)\n\n` +
    `**Sessions:** a, b, c\n\n**Evidence:**\n- a line 4: ${key}\n`;
  await store.commitCanonical({
    relativePath: "memory/pattern-deadbeef.md",
    body,
    baseHash: BASE_ABSENT,
    provenance: { authored_by: "human" },
  });
  return store;
}

describe("measureEfficacy", () => {
  it("PERSISTING when the pattern keeps recurring after acceptance", async () => {
    const store = await storeWithPatternNote(
      "tool_error",
      "eisdir: illegal operation on a directory",
      new Date(T0).toISOString(),
    );
    const after = [
      mk("p1", T0 + 1 * DAY, ["EISDIR: illegal operation on a directory"]),
      mk("p2", T0 + 2 * DAY, ["EISDIR: illegal operation on a directory"]),
      mk("p3", T0 + 3 * DAY, []),
      mk("p4", T0 + 4 * DAY, []),
      mk("p5", T0 + 5 * DAY, []),
    ];
    const r = await measureEfficacy(store, after);
    expect(r.length).toBe(1);
    expect(r[0]?.verdict).toBe("PERSISTING");
    expect(r[0]?.after_k).toBe(2);
    expect(r[0]?.after_n).toBe(5);
  });

  it("RESOLVED when the pattern stops appearing AND exposure was adequate", async () => {
    const store = await storeWithPatternNote(
      "tool_error",
      "eisdir: illegal operation on a directory",
      new Date(T0).toISOString(),
    );
    // baseline claim is 3/10 (0.3); 15 clean post-acceptance sessions projects an
    // expected 4.5 recurrences — comfortably over the DORMANT_MIN_EXPECTED floor.
    const after = Array.from({ length: 15 }, (_, i) => mk(`q${i}`, T0 + (i + 1) * DAY, []));
    const r = await measureEfficacy(store, after);
    expect(r[0]?.verdict).toBe("RESOLVED");
    expect(r[0]?.after_k).toBe(0);
  });

  it("INSUFFICIENT_DATA on a thin post-acceptance window — never a verdict from 2 sessions", async () => {
    const store = await storeWithPatternNote(
      "tool_error",
      "eisdir: illegal operation on a directory",
      new Date(T0).toISOString(),
    );
    const after = [mk("r1", T0 + DAY, []), mk("r2", T0 + 2 * DAY, [])];
    const r = await measureEfficacy(store, after);
    expect(r[0]?.verdict).toBe("INSUFFICIENT_DATA");
  });

  it("sessions from BEFORE acceptance never count against the note", async () => {
    const store = await storeWithPatternNote(
      "tool_error",
      "eisdir: illegal operation on a directory",
      new Date(T0).toISOString(),
    );
    const mixed = [
      // five noisy sessions BEFORE the note existed
      ...Array.from({ length: 5 }, (_, i) =>
        mk(`old${i}`, T0 - (i + 1) * DAY, ["EISDIR: illegal operation on a directory"]),
      ),
      // eleven clean ones after — enough exposure (0.3 baseline * 11 = 3.3 expected)
      // for RESOLVED rather than DORMANT
      ...Array.from({ length: 11 }, (_, i) => mk(`new${i}`, T0 + (i + 1) * DAY, [])),
    ];
    const r = await measureEfficacy(store, mixed);
    expect(r[0]?.after_n).toBe(11);
    expect(r[0]?.verdict).toBe("RESOLVED");
  });

  it("a store with no pattern notes reports nothing (not an error)", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-eff0-"));
    const store = await MemoryStore.initStore(root);
    const r = await measureEfficacy(store, [mk("x", T0, [])]);
    expect(r).toEqual([]);
  });
});

describe("pre-fix notes with raw colons in frontmatter", () => {
  it("an unparseable note surfaces as UNPARSEABLE_NOTE, never a silent skip", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-eff-raw-"));
    const store = await MemoryStore.initStore(root);
    // the exact pre-fix emitter shape: unquoted colon inside the description value
    const lines = [
      "---",
      "title: Recurring tool error",
      "description: seen in 16/882 sessions — eisdir: illegal operation on a directory",
      "---",
      "",
      "**Pattern:** eisdir: illegal operation on a directory",
      "",
    ];
    const body = lines.join("\n");
    await store.commitCanonical({
      relativePath: "memory/pattern-cafebabe.md",
      body,
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const r = await measureEfficacy(store, []);
    expect(r.length).toBe(1);
    expect(r[0]?.verdict).toBe("UNPARSEABLE_NOTE");
  });
});

describe("DORMANT verdict — the exposure gate", () => {
  it("zero post-apply hits but thin exposure -> DORMANT, not RESOLVED", async () => {
    const store = await storeWithPatternNote(
      "tool_error",
      "eisdir: illegal operation on a directory",
      new Date(T0).toISOString(),
    );
    // baseline claim 3/10 (0.3 rate); 6 clean sessions projects an expected 1.8
    // recurrences — below DORMANT_MIN_EXPECTED (3), so this is UNEXERCISED, not proven.
    const after = Array.from({ length: 6 }, (_, i) => mk(`d${i}`, T0 + (i + 1) * DAY, []));
    const r = await measureEfficacy(store, after);
    expect(r[0]?.verdict).toBe("DORMANT");
    expect(r[0]?.after_k).toBe(0);
  });

  it("DORMANT never becomes an expiry proposal, even at a repeating streak", async () => {
    // A thin baseline claim (1/500 — near-zero rate) keeps `expected` under the
    // DORMANT floor no matter how large the post-acceptance window gets.
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-eff-dormant2-"));
    const thinStore = await MemoryStore.initStore(root);
    const body = `---\ntitle: Recurring tool error\ndescription: ${JSON.stringify("seen in 1/500 sessions — rare thing")}\ncreatedAt: ${new Date(T0).toISOString()}\n---\n\n**Pattern:** rare thing\n\n**Prevalence:** 1/500 sessions (1 occurrences)\n`;
    await thinStore.commitCanonical({
      relativePath: "memory/pattern-thinbase.md",
      body,
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const digests = Array.from({ length: 20 }, (_, i) => mk(`f${i}`, T0 + (i + 1) * DAY, []));
    await measureEfficacy(thinStore, digests);
    const r2 = await measureEfficacy(thinStore, digests, {
      proposeExpiry: true,
      expiryJustification: "mechanized",
    });
    expect(r2[0]?.verdict).toBe("DORMANT");
    expect(r2[0]?.streak).toBe(2);
    const { listProposals } = await import("../src/review.js");
    const pending = await listProposals(thinStore);
    expect(pending.some((p) => p.action === "expire")).toBe(false);
  });

  it("no baseline prevalence claim to project (missing `**Prevalence:**` line) falls back to RESOLVED", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-eff-nobaseline-"));
    const store2 = await MemoryStore.initStore(root);
    const body = `---\ntitle: Recurring tool error\ncreatedAt: ${new Date(T0).toISOString()}\n---\n\n**Pattern:** eisdir: illegal operation on a directory\n`;
    await store2.commitCanonical({
      relativePath: "memory/pattern-nobase.md",
      body,
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const after = Array.from({ length: 6 }, (_, i) => mk(`g${i}`, T0 + (i + 1) * DAY, []));
    const r = await measureEfficacy(store2, after);
    expect(r[0]?.verdict).toBe("RESOLVED");
  });
});

describe("import-outcome gating (efficacy scores only notes that actually landed)", () => {
  it("a note with a recorded REFUSED outcome for its exact text is excluded from scoring", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-eff-import-"));
    const store = await MemoryStore.initStore(root);
    const body = `---\ntitle: Recurring tool error\ndescription: ${JSON.stringify("seen in 3/10 sessions — eisdir")}\ncreatedAt: ${new Date(T0).toISOString()}\n---\n\n**Pattern:** eisdir: illegal operation on a directory\n\n**Prevalence:** 3/10 sessions (4 occurrences)\n`;
    await store.commitCanonical({
      relativePath: "memory/pattern-refused.md",
      body,
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const { recordImportOutcome } = await import("../src/dream/import-outcomes.js");
    await recordImportOutcome(store, {
      targetPath: "memory/pattern-refused.md",
      body,
      outcome: "refused",
      reason: "CAS_CONFLICT",
    });
    const after = Array.from({ length: 15 }, (_, i) => mk(`h${i}`, T0 + (i + 1) * DAY, []));
    const r = await measureEfficacy(store, after);
    expect(r).toEqual([]);
  });

  it("a note with no outcome record scores normally (legacy behavior)", async () => {
    const store = await storeWithPatternNote(
      "tool_error",
      "eisdir: illegal operation on a directory",
      new Date(T0).toISOString(),
    );
    const after = Array.from({ length: 15 }, (_, i) => mk(`i${i}`, T0 + (i + 1) * DAY, []));
    const r = await measureEfficacy(store, after);
    expect(r.length).toBe(1);
    expect(r[0]?.verdict).toBe("RESOLVED");
  });

  it("a note with a recorded LANDED outcome scores normally", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-eff-landed-"));
    const store = await MemoryStore.initStore(root);
    const body = `---\ntitle: Recurring tool error\ndescription: ${JSON.stringify("seen in 3/10 sessions — eisdir")}\ncreatedAt: ${new Date(T0).toISOString()}\n---\n\n**Pattern:** eisdir: illegal operation on a directory\n\n**Prevalence:** 3/10 sessions (4 occurrences)\n`;
    await store.commitCanonical({
      relativePath: "memory/pattern-landed.md",
      body,
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const { recordImportOutcome } = await import("../src/dream/import-outcomes.js");
    await recordImportOutcome(store, {
      targetPath: "memory/pattern-landed.md",
      body,
      outcome: "landed",
    });
    const after = Array.from({ length: 15 }, (_, i) => mk(`j${i}`, T0 + (i + 1) * DAY, []));
    const r = await measureEfficacy(store, after);
    expect(r.length).toBe(1);
    expect(r[0]?.verdict).toBe("RESOLVED");
  });
});
