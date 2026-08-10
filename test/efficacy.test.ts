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
    relativePath: `memory/pattern-deadbeef.md`,
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

  it("RESOLVED when the pattern stops appearing", async () => {
    const store = await storeWithPatternNote(
      "tool_error",
      "eisdir: illegal operation on a directory",
      new Date(T0).toISOString(),
    );
    const after = Array.from({ length: 6 }, (_, i) => mk(`q${i}`, T0 + (i + 1) * DAY, []));
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
      // five clean ones after
      ...Array.from({ length: 5 }, (_, i) => mk(`new${i}`, T0 + (i + 1) * DAY, [])),
    ];
    const r = await measureEfficacy(store, mixed);
    expect(r[0]?.after_n).toBe(5);
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
