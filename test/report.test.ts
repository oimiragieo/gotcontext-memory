import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { EfficacyResult } from "../src/dream/efficacy.js";
import {
  buildReportItems,
  generateReport,
  ingestDecisions,
  loadReportDecisions,
  triageItem,
} from "../src/report.js";
import { listProposals } from "../src/review.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

/**
 * HITL decision report round-trip: generate -> a human (or a fixture standing
 * in for one) writes decisions.json -> ingest applies it. Every assertion here
 * mirrors a GATE from the brief: the .done rename (never double-fires), a
 * rejected path-traversal reference, and deny-requires-a-reason.
 */

function baseResult(over: Partial<EfficacyResult> = {}): EfficacyResult {
  return {
    notePath: "memory/pattern-x.md",
    kind: "tool_error",
    pattern: "eisdir",
    acceptedAt: new Date().toISOString(),
    after_k: 0,
    after_n: 20,
    occurrences: 0,
    verdict: "RESOLVED",
    streak: 1,
    ...over,
  };
}

describe("buildReportItems", () => {
  it("DORMANT and streak>=2 PERSISTING become REVIEW items; RESOLVED w/o expiry_recommendation is not an item", () => {
    const results: EfficacyResult[] = [
      baseResult({ notePath: "memory/pattern-dormant.md", verdict: "DORMANT" }),
      baseResult({
        notePath: "memory/pattern-persisting.md",
        verdict: "PERSISTING",
        after_k: 4,
        streak: 2,
        recommend_mechanize: true,
      }),
      baseResult({
        notePath: "memory/pattern-persisting-once.md",
        verdict: "PERSISTING",
        after_k: 4,
        streak: 1,
      }),
      baseResult({ notePath: "memory/pattern-resolved-quiet.md", verdict: "RESOLVED" }),
    ];
    const items = buildReportItems(results);
    const kinds = items.map((i) => `${i.kind}:${i.notePath}`).sort();
    expect(kinds).toEqual([
      "dormant:memory/pattern-dormant.md",
      "persisting:memory/pattern-persisting.md",
    ]);
  });

  it("expiry_recommendation RETAIN/EXPIRE map to badge-carrying expiry items", () => {
    const results: EfficacyResult[] = [
      baseResult({
        notePath: "memory/pattern-retain.md",
        streak: 2,
        expiry_recommendation: "RETAIN",
      }),
      baseResult({
        notePath: "memory/pattern-expire.md",
        streak: 2,
        expiry_recommendation: "EXPIRE",
        expiry_justification: "mechanized",
      }),
    ];
    const items = buildReportItems(results);
    expect(items.find((i) => i.notePath === "memory/pattern-retain.md")?.recommendation).toBe(
      "RETAIN",
    );
    expect(items.find((i) => i.notePath === "memory/pattern-expire.md")?.recommendation).toBe(
      "EXPIRE",
    );
    expect(items.every((i) => i.kind === "expiry")).toBe(true);
  });
});

describe("generateReport", () => {
  it("renders a self-contained HTML report with no items already decided", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-report-gen-"));
    const store = await MemoryStore.initStore(root);
    const results = [baseResult({ notePath: "memory/pattern-dormant.md", verdict: "DORMANT" })];
    const { html, pending } = await generateReport(store, results);
    expect(pending.length).toBe(1);
    expect(html).toContain("memory/pattern-dormant.md");
    expect(html).toContain("showSaveFilePicker");
    expect(html).not.toContain("<script src="); // no external script/network dependency
  });

  it("an item with a prior decision is excluded from the next report", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-report-decided-"));
    const store = await MemoryStore.initStore(root);
    const results = [baseResult({ notePath: "memory/pattern-dormant.md", verdict: "DORMANT" })];
    const first = await generateReport(store, results);
    expect(first.pending.length).toBe(1);
    const { recordReportDecision } = await import("../src/report.js");
    await recordReportDecision(store, first.pending[0].id, "deny", "known false positive");
    const second = await generateReport(store, results);
    expect(second.pending.length).toBe(0);
  });
});

describe("triage adapter (optional council)", () => {
  it("unanimous APPROVE across N seats auto-approves", async () => {
    const item = buildReportItems([baseResult({ verdict: "DORMANT" })])[0];
    const verdict = await triageItem(
      ["node -e \"process.stdin.resume();console.log('RECOMMENDED: APPROVE')\""],
      item,
    );
    expect(verdict).toBe("APPROVE");
  });

  it("a split between seats stays for the human report", async () => {
    const item = buildReportItems([baseResult({ verdict: "DORMANT" })])[0];
    const verdict = await triageItem(
      [
        "node -e \"console.log('RECOMMENDED: APPROVE')\"",
        "node -e \"console.log('RECOMMENDED: DENY')\"",
      ],
      item,
    );
    expect(verdict).toBeNull();
  });

  it("a seat that produces no verdict line fails OPEN to the human report", async () => {
    const item = buildReportItems([baseResult({ verdict: "DORMANT" })])[0];
    const verdict = await triageItem(["node -e \"console.log('no opinion here')\""], item);
    expect(verdict).toBeNull();
  });

  it("no triageCommand configured -> null (human default)", async () => {
    const item = buildReportItems([baseResult({ verdict: "DORMANT" })])[0];
    expect(await triageItem(undefined, item)).toBeNull();
  });
});

describe("ingest-decisions round trip", () => {
  async function storeWithExpiryNote() {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-report-ingest-"));
    const store = await MemoryStore.initStore(root);
    const body = `---\ntitle: Recurring tool error\ndescription: d\ncreatedAt: ${new Date().toISOString()}\n---\n\n**Pattern:** eisdir\n`;
    await store.commitCanonical({
      relativePath: "memory/pattern-expireme.md",
      body,
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    return { root, store };
  }

  it("approve on an expiry item files an expire PROPOSAL (still HITL — a human reviews it)", async () => {
    const { root, store } = await storeWithExpiryNote();
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-report-cwd-"));
    const decisions = {
      generatedAt: new Date().toISOString(),
      items: [
        {
          id: "item-1",
          kind: "expiry",
          notePath: "memory/pattern-expireme.md",
          action: "approve",
        },
      ],
    };
    await writeFile(path.join(cwd, "decisions.json"), JSON.stringify(decisions, null, 2), "utf8");
    const result = await ingestDecisions(store, "decisions.json", cwd);
    expect(result.approved).toBe(1);
    const pending = await listProposals(store);
    expect(
      pending.some((p) => p.action === "expire" && p.targetPath === "memory/pattern-expireme.md"),
    ).toBe(true);
    void root;
  });

  it("deny records a reason via recordReportDecision; a later report never re-shows the item", async () => {
    const { store } = await storeWithExpiryNote();
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-report-cwd2-"));
    const decisions = {
      items: [
        {
          id: "item-2",
          kind: "dormant",
          notePath: "memory/pattern-expireme.md",
          action: "deny",
          reason: "already investigated, false positive",
        },
      ],
    };
    await writeFile(path.join(cwd, "decisions.json"), JSON.stringify(decisions), "utf8");
    const result = await ingestDecisions(store, "decisions.json", cwd);
    expect(result.denied).toBe(1);
    const ledger = await loadReportDecisions(store);
    expect(ledger.get("item-2")?.decision).toBe("deny");
    expect(ledger.get("item-2")?.reason).toBe("already investigated, false positive");
  });

  it("deny WITHOUT a reason throws — never silently suppressed", async () => {
    const { store } = await storeWithExpiryNote();
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-report-cwd3-"));
    const decisions = {
      items: [
        { id: "item-3", kind: "dormant", notePath: "memory/pattern-expireme.md", action: "deny" },
      ],
    };
    await writeFile(path.join(cwd, "decisions.json"), JSON.stringify(decisions), "utf8");
    await expect(ingestDecisions(store, "decisions.json", cwd)).rejects.toThrow(
      /deny requires a reason/,
    );
  });

  it("defer records nothing — item remains pending for the next report", async () => {
    const { store } = await storeWithExpiryNote();
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-report-cwd4-"));
    const decisions = {
      items: [
        {
          id: "item-4",
          kind: "dormant",
          notePath: "memory/pattern-expireme.md",
          action: "defer",
        },
      ],
    };
    await writeFile(path.join(cwd, "decisions.json"), JSON.stringify(decisions), "utf8");
    const result = await ingestDecisions(store, "decisions.json", cwd);
    expect(result.deferred).toBe(1);
    const ledger = await loadReportDecisions(store);
    expect(ledger.has("item-4")).toBe(false);
  });

  it("renames the source file to <name>.done after processing — never double-fires", async () => {
    const { store } = await storeWithExpiryNote();
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-report-cwd5-"));
    const decisions = { items: [] as unknown[] };
    await writeFile(path.join(cwd, "decisions.json"), JSON.stringify(decisions), "utf8");
    await ingestDecisions(store, "decisions.json", cwd);
    // original is gone
    await expect(readFile(path.join(cwd, "decisions.json"), "utf8")).rejects.toThrow();
    // .done exists
    const done = await readFile(path.join(cwd, "decisions.json.done"), "utf8");
    expect(JSON.parse(done)).toEqual(decisions);
    // a second ingest against the same name cannot find the (already-renamed) file
    await expect(ingestDecisions(store, "decisions.json", cwd)).rejects.toThrow();
  });

  it("rejects a path-traversal-shaped file reference", async () => {
    const { store } = await storeWithExpiryNote();
    const cwd = await mkdtemp(path.join(os.tmpdir(), "gcm-report-cwd6-"));
    await expect(ingestDecisions(store, "../decisions.json", cwd)).rejects.toThrow(/basename-only/);
    await expect(ingestDecisions(store, "sub/decisions.json", cwd)).rejects.toThrow(
      /basename-only/,
    );
  });
});
