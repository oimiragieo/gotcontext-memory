import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type SessionDigest, emptyDigest, noteMemoryRead } from "../src/dream/digest.js";
import { measureEfficacy } from "../src/dream/efficacy.js";
import { buildReportItems } from "../src/report.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

/**
 * Retrieval exposure (BL-DRM-020). Ported from the installed Python engine on
 * 2026-08-15, where the top PERSISTING notes turned out to have been opened
 * zero times after acceptance — a DELIVERY failure that acquisition and
 * verification metrics both report as "the note is wrong".
 *
 * The load-bearing arm is the LAST one: a digest with no read telemetry must
 * score `reads_post: undefined`, never 0. Conflating "not instrumented" with
 * "never opened" would invent a delivery failure for every corpus digested
 * before this field existed.
 */
const DAY = 86_400_000;
const T0 = Date.parse("2026-03-01T00:00:00Z");
const KEY = "eisdir: illegal operation on a directory";
const NOTE = "memory/pattern-feedbeef.md";

function mk(id: string, ts: number, snips: string[], reads?: string[] | null): SessionDigest {
  const d = emptyDigest(`/x/${id}.jsonl`, { source: "claude" });
  d.id = id;
  d.sessionTs = ts;
  d.nToolError = snips.length;
  d.toolErrors = snips.map((s, i) => ({ line: i + 1, snip: s }));
  d.models = ["model-a"];
  if (reads === null) {
    // A pre-instrumentation digest: the channel is absent entirely.
    d.nMemoryReads = undefined;
    d.memoryReads = undefined;
  } else if (reads) {
    d.nMemoryReads = reads.length;
    d.memoryReads = reads;
  }
  return d;
}

async function storeWithNote() {
  const root = await mkdtemp(path.join(os.tmpdir(), "gcm-deliver-"));
  const store = await MemoryStore.initStore(root);
  const body =
    `---\ntitle: Recurring tool error\ndescription: ${JSON.stringify(`seen in 3/10 sessions — ${KEY}`)}\n` +
    `createdAt: ${new Date(T0).toISOString()}\n---\n\n**Pattern:** ${KEY}\n\n**Prevalence:** 3/10 sessions (4 occurrences)\n`;
  await store.commitCanonical({
    relativePath: NOTE,
    body,
    baseHash: BASE_ABSENT,
    provenance: { authored_by: "human" },
  });
  return store;
}

const noisy = (n: number, reads?: string[] | null) =>
  Array.from({ length: n }, (_, i) =>
    mk(`n${i}`, T0 + (i + 1) * DAY, ["EISDIR: illegal operation on a directory"], reads),
  );

describe("noteMemoryRead", () => {
  it("counts a Read of a stored note and records its store-relative path", () => {
    const d = emptyDigest("/x/s.jsonl", { source: "claude" });
    noteMemoryRead(d, "Read", { file_path: "C:\\Users\\x\\store\\memory\\pattern-feedbeef.md" });
    expect(d.nMemoryReads).toBe(1);
    expect(d.memoryReads).toEqual(["memory/pattern-feedbeef.md"]);
  });

  it("keeps same-named notes in different subdirectories distinct", () => {
    const d = emptyDigest("/x/s.jsonl", { source: "claude" });
    noteMemoryRead(d, "Read", { file_path: "/store/memory/a/dup.md" });
    noteMemoryRead(d, "Read", { file_path: "/store/memory/b/dup.md" });
    expect(d.nMemoryReads).toBe(2);
    expect(d.memoryReads).toEqual(["memory/a/dup.md", "memory/b/dup.md"]);
  });

  it("counts the index itself", () => {
    const d = emptyDigest("/x/s.jsonl", { source: "claude" });
    noteMemoryRead(d, "read", { filePath: "/home/u/store/MEMORY.md" });
    expect(d.nMemoryReads).toBe(1);
    expect(d.memoryReads).toEqual(["MEMORY.md"]);
  });

  it("ignores non-Read tools and non-memory paths", () => {
    const d = emptyDigest("/x/s.jsonl", { source: "claude" });
    noteMemoryRead(d, "Write", { file_path: "/store/memory/note.md" });
    noteMemoryRead(d, "Read", { file_path: "/src/memoryPool.ts" });
    noteMemoryRead(d, "Read", {});
    expect(d.nMemoryReads).toBe(0);
    expect(d.memoryReads).toEqual([]);
  });
});

describe("efficacy delivery signal", () => {
  it("PERSISTING with zero post-acceptance reads recommends DELIVERY, not mechanization", async () => {
    const store = await storeWithNote();
    const digests = noisy(8, []); // instrumented, and the note is never opened
    const results = await measureEfficacy(store, digests, {});
    const r = results.find((x) => x.notePath === NOTE);
    expect(r?.verdict).toBe("PERSISTING");
    expect(r?.reads_post).toBe(0);
    expect(r?.recommend_deliver).toBe(true);
  });

  it("counts reads when the note IS opened, and does not flag delivery", async () => {
    const store = await storeWithNote();
    const digests = noisy(8, [NOTE]);
    const results = await measureEfficacy(store, digests, {});
    const r = results.find((x) => x.notePath === NOTE);
    expect(r?.verdict).toBe("PERSISTING");
    expect(r?.reads_post).toBe(8);
    expect(r?.recommend_deliver).toBeUndefined();
  });

  it("a different note that merely shares a basename does NOT count as a read", async () => {
    const store = await storeWithNote();
    const digests = noisy(8, ["memory/other/pattern-feedbeef.md"]);
    const results = await measureEfficacy(store, digests, {});
    const r = results.find((x) => x.notePath === NOTE);
    expect(r?.reads_post).toBe(0);
    expect(r?.recommend_deliver).toBe(true);
  });

  it("uninstrumented digests score reads_post undefined — never 0", async () => {
    const store = await storeWithNote();
    const digests = noisy(8, null); // channel absent, as in pre-BL-DRM-020 corpora
    const results = await measureEfficacy(store, digests, {});
    const r = results.find((x) => x.notePath === NOTE);
    expect(r?.verdict).toBe("PERSISTING");
    expect(r?.reads_post).toBeUndefined();
    expect(r?.recommend_deliver).toBeUndefined();
  });
});

describe("report surfaces undelivered notes", () => {
  it("emits an undelivered item that names the surfaces to move the rule to", () => {
    const items = buildReportItems([
      {
        notePath: NOTE,
        kind: "Recurring_tool_error",
        pattern: KEY,
        acceptedAt: new Date(T0).toISOString(),
        after_k: 6,
        after_n: 8,
        occurrences: 6,
        verdict: "PERSISTING",
        streak: 2,
        reads_post: 0,
        recommend_mechanize: true,
        recommend_deliver: true,
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("undelivered");
    expect(items[0].text).toContain("reads_post=0");
    expect(items[0].reason).toContain("DELIVERY failure");
  });
});
