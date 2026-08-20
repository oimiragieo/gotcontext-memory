import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DIGEST_SIGNAL_CAP, digestTranscriptFile, minePrevalence } from "../src/dream/digest.js";

async function fixture(lines: string[]): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "gcm-digest-"));
  const file = path.join(dir, "proj-a", "sess1.jsonl");
  await mkdtemp(path.join(os.tmpdir(), "gcm-x-")); // keep tmp churn similar to siblings
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${lines.join("\n")}\n`, "utf8");
  return file;
}

function userLine(text: string, ts = "2026-01-01T00:00:00Z"): string {
  return JSON.stringify({ timestamp: ts, message: { role: "user", content: text } });
}

describe("digest: streaming + bounded", () => {
  it("counts are NEVER bounded by the signal cap that bounds the arrays", async () => {
    // Regression for the 2026-08-08 contamination bug in the installed engine:
    // capping with `&&` inside the classifier let overflow fall through to the
    // next branch, corrupting BOTH the counts and the classification.
    const overflow = DIGEST_SIGNAL_CAP + 25;
    const file = await fixture(
      Array.from({ length: overflow }, (_, i) => userLine(`Stop hook feedback: block #${i}`)),
    );
    const d = await digestTranscriptFile(file, { source: "claude" });

    expect(d.nHookBlocks).toBe(overflow); // count is truthful
    expect(d.hookBlocks.length).toBe(DIGEST_SIGNAL_CAP); // array is bounded
    expect(d.nUserCorrections).toBe(0); // overflow must NOT leak into corrections
    expect(d.userCorrections).toEqual([]);
  });

  it("classifies hook feedback as a hook block, never as a user correction", async () => {
    const file = await fixture([
      userLine("Stop hook feedback: you named ready work then stopped"),
      userLine("no, that is wrong — revert it"),
    ]);
    const d = await digestTranscriptFile(file, { source: "claude" });
    expect(d.nHookBlocks).toBe(1);
    expect(d.nUserCorrections).toBe(1);
    expect(d.userCorrections[0]?.snip).toMatch(/no, that is wrong/);
  });

  it("streams: a file far larger than the byte cap is TRUNCATED, not malformed", async () => {
    const big = Array.from({ length: 4000 }, (_, i) =>
      userLine(`filler line ${i} ${"x".repeat(300)}`),
    );
    const file = await fixture(big);
    const d = await digestTranscriptFile(file, { source: "claude", maxBytes: 64 * 1024 });
    expect(d.truncated).toBe(true);
    expect(d.malformed).toBe(0); // a size limit is NOT corruption
    expect(d.nUser).toBeGreaterThan(0);
  });

  it("malformed lines are counted separately and do not abort the digest", async () => {
    const file = await fixture([userLine("hello"), "{not json", userLine("world")]);
    const d = await digestTranscriptFile(file, { source: "claude" });
    expect(d.malformed).toBe(1);
    expect(d.nUser).toBe(2);
  });

  it("sessionTs comes from turn timestamps, not file mtime", async () => {
    // The installed engine ordered by digest-file mtime, so a rebuild stamped every
    // digest with 'now' and flattened all history to a single instant.
    const file = await fixture([
      userLine("early", "2025-03-04T05:06:07Z"),
      userLine("late", "2025-03-09T05:06:07Z"),
    ]);
    const d = await digestTranscriptFile(file, { source: "claude" });
    expect(new Date(d.sessionTs).toISOString()).toBe("2025-03-09T05:06:07.000Z");
    expect(d.sessionTs).toBeLessThan(Date.now() - 1000);
  });

  it("captures preference spans with line numbers for citation", async () => {
    const file = await fixture([
      userLine("chatter"),
      userLine("Please remember: always run tests before committing."),
    ]);
    const d = await digestTranscriptFile(file, { source: "claude" });
    expect(d.nPreferences).toBe(1);
    expect(d.preferences[0]?.line).toBe(2);
    expect(d.preferences[0]?.span).toMatch(/always run tests/i);
  });
});

describe("prevalence mining across sessions", () => {
  const mk = (id: string, over: Partial<Record<string, unknown>> = {}) =>
    ({
      id,
      source: "claude",
      path: `/x/${id}.jsonl`,
      sessionTs: Date.parse("2026-01-01T00:00:00Z"),
      bytes: 10,
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
      ...over,
    }) as never;

  it("requires a pattern in >=2 sessions — one session is never a pattern", () => {
    const found = minePrevalence([
      mk("s1", { nToolError: 3, toolErrors: [{ line: 4, snip: "EACCES open failed" }] }),
    ]);
    expect(found).toEqual([]);
  });

  it("reports k/n with the contributing session ids", () => {
    const err = [{ line: 4, snip: "EACCES open failed" }];
    const found = minePrevalence([
      mk("s1", { nToolError: 3, toolErrors: err }),
      mk("s2", { nToolError: 1, toolErrors: err }),
      mk("s3", {}),
    ]);
    expect(found.length).toBe(1);
    expect(found[0]?.k).toBe(2);
    expect(found[0]?.n).toBe(3);
    expect(found[0]?.sessions.sort()).toEqual(["s1", "s2"]);
    expect(found[0]?.citations.length).toBeGreaterThan(0);
  });
});

describe("usableSignalKey — a signature must survive its own normalisation", () => {
  // 2026-08-20 (Python engine receipt, session ledger L13): the span
  // `/mnt/c/Users/oimir` normalised to the bare key "<path>", which matched
  // 696/986 failure-bearing digests and fabricated two PERSISTING x14 verdicts.
  it("rejects keys that are placeholder residue only", async () => {
    const { usableSignalKey, signalKey } = await import("../src/dream/digest.js");
    expect(usableSignalKey(signalKey("/mnt/c/Users/oimir"))).toBe(false);
    expect(usableSignalKey(signalKey("12345 67890"))).toBe(false);
    expect(usableSignalKey(signalKey("deadbeefcafe0123"))).toBe(false);
  });
  it("accepts keys that keep real words after normalisation", async () => {
    const { usableSignalKey, signalKey } = await import("../src/dream/digest.js");
    expect(usableSignalKey(signalKey("EISDIR: illegal operation on a directory"))).toBe(true);
  });
});

describe("minePrevalence — degenerate keys never form a bucket", () => {
  const mk2 = (id: string, snip: string) =>
    ({
      id,
      source: "claude",
      path: `/x/${id}.jsonl`,
      sessionTs: 1,
      bytes: 1,
      truncated: false,
      malformed: 0,
      nUser: 1,
      nAssistant: 1,
      nToolUse: 0,
      nToolError: 1,
      nHookBlocks: 0,
      nUserCorrections: 0,
      nPreferences: 0,
      hookBlocks: [],
      userCorrections: [],
      toolErrors: [{ line: 1, snip }],
      preferences: [],
      skills: [],
      models: [],
    }) as never;
  it("two sessions whose snips are bare paths do not become a '<path>' pattern", () => {
    const found = minePrevalence([
      mk2("s1", "/mnt/c/Users/alice"),
      mk2("s2", "C:devprojectsother"),
    ]);
    expect(found).toEqual([]);
  });
});
