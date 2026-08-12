import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SessionDigest } from "../src/dream/digest.js";
import { measureEfficacy } from "../src/dream/efficacy.js";
import { listProposals } from "../src/review.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

/**
 * Lifecycle port from the installed engine (2026-08-12): verdicts become
 * TRENDS (streaks across scoring runs), trends become ACTIONS — all inside the
 * HITL contract. RESOLVED x2 with an adequate window emits an EXPIRE PROPOSAL
 * through the normal propose->review flow (a human still accepts); PERSISTING x2
 * emits a mechanize RECOMMENDATION in the result (this toolkit is
 * harness-agnostic: it can say "this needs a hook", it never installs one).
 * Model-conditional verdicts ride along (n>=5 per model).
 */
const DAY = 86_400_000;
const T0 = Date.parse("2026-03-01T00:00:00Z");

function mk(id: string, ts: number, snips: string[], model = "model-a"): SessionDigest {
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
    nToolError: snips.length,
    nHookBlocks: 0,
    nUserCorrections: 0,
    nPreferences: 0,
    hookBlocks: [],
    userCorrections: [],
    toolErrors: snips.map((s, i) => ({ line: i + 1, snip: s })),
    preferences: [],
    skills: [],
    models: [model],
  };
}

async function storeWithNote(key: string) {
  const root = await mkdtemp(path.join(os.tmpdir(), "gcm-lc-"));
  const store = await MemoryStore.initStore(root);
  const body =
    `---\ntitle: Recurring tool error\n` +
    `description: ${JSON.stringify(`seen in 3/10 sessions — ${key}`)}\n` +
    `createdAt: ${new Date(T0).toISOString()}\n---\n\n` +
    `**Pattern:** ${key}\n\n**Prevalence:** 3/10 sessions (4 occurrences)\n`;
  await store.commitCanonical({
    relativePath: "memory/pattern-feedbeef.md",
    body,
    baseHash: BASE_ABSENT,
    provenance: { authored_by: "human" },
  });
  return store;
}

const KEY = "eisdir: illegal operation on a directory";
const clean = (n: number, model = "model-a") =>
  Array.from({ length: n }, (_, i) => mk(`c${model}${i}`, T0 + (i + 1) * DAY, [], model));
const noisy = (n: number, model = "model-a") =>
  Array.from({ length: n }, (_, i) =>
    mk(`n${model}${i}`, T0 + (i + 1) * DAY, ["EISDIR: illegal operation on a directory"], model),
  );

describe("streaks across scoring runs", () => {
  it("second identical verdict reports streak 2; a flip resets to 1", async () => {
    const store = await storeWithNote(KEY);
    const r1 = await measureEfficacy(store, clean(20));
    expect(r1[0]?.streak).toBe(1);
    const r2 = await measureEfficacy(store, clean(20));
    expect(r2[0]?.verdict).toBe("RESOLVED");
    expect(r2[0]?.streak).toBe(2);
    const r3 = await measureEfficacy(store, noisy(6).concat(clean(14)));
    expect(r3[0]?.verdict).toBe("PERSISTING");
    expect(r3[0]?.streak).toBe(1);
  });
});

describe("model-conditional verdicts", () => {
  it("splits RESOLVED/PERSISTING per model when each has n>=5", async () => {
    const store = await storeWithNote(KEY);
    const digests = [...noisy(6, "model-a"), ...clean(8, "model-b")];
    const r = await measureEfficacy(store, digests);
    expect(r[0]?.verdict).toBe("PERSISTING");
    expect(r[0]?.model_verdicts?.["model-a"]).toMatch(/^PERSISTING 6\/6/);
    expect(r[0]?.model_verdicts?.["model-b"]).toMatch(/^RESOLVED 0\/8/);
  });

  it("a model under n=5 gets NO verdict — thin windows never judge", async () => {
    const store = await storeWithNote(KEY);
    const r = await measureEfficacy(store, [...clean(8, "model-b"), ...noisy(2, "model-c")]);
    expect(r[0]?.model_verdicts?.["model-c"]).toBeUndefined();
  });
});

describe("lifecycle actions (HITL preserved)", () => {
  it("RESOLVED x2 with n>=15 + proposeExpiry creates an expire PROPOSAL, applies nothing", async () => {
    const store = await storeWithNote(KEY);
    await measureEfficacy(store, clean(20));
    const before = await store.memoryTreeHash();
    const r = await measureEfficacy(store, clean(20), { proposeExpiry: true });
    expect(r[0]?.streak).toBe(2);
    const pending = await listProposals(store);
    const exp = pending.find((p) => p.action === "expire");
    expect(exp?.targetPath).toBe("memory/pattern-feedbeef.md");
    // the note itself is UNTOUCHED — a human still reviews
    expect(await store.memoryTreeHash()).toBe(before);
  });

  it("expiry proposal is not duplicated on the next run", async () => {
    const store = await storeWithNote(KEY);
    await measureEfficacy(store, clean(20));
    await measureEfficacy(store, clean(20), { proposeExpiry: true });
    await measureEfficacy(store, clean(20), { proposeExpiry: true });
    const pending = await listProposals(store);
    expect(pending.filter((p) => p.action === "expire").length).toBe(1);
  });

  it("PERSISTING x2 sets recommend_mechanize (a recommendation, never an install)", async () => {
    const store = await storeWithNote(KEY);
    await measureEfficacy(store, noisy(3).concat(clean(17)));
    const r = await measureEfficacy(store, noisy(3).concat(clean(17)));
    expect(r[0]?.verdict).toBe("PERSISTING");
    expect(r[0]?.streak).toBe(2);
    expect(r[0]?.recommend_mechanize).toBe(true);
  });
});
