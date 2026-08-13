import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { loadImportOutcomes, recordImportOutcome } from "../src/dream/import-outcomes.js";
import { importStore } from "../src/portability.js";
import { acceptProposal, rejectProposal } from "../src/review.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

async function archiveWith(rows: Array<{ path: string; body: string }>): Promise<string> {
  const jsonl = rows
    .map((r) =>
      JSON.stringify({
        path: r.path,
        contentBase64: Buffer.from(r.body, "utf8").toString("base64"),
      }),
    )
    .join("\n");
  const p = path.join(
    os.tmpdir(),
    `gcm-imp-arch-${Date.now()}-${Math.random().toString(36).slice(2)}.gcm.gz`,
  );
  await writeFile(p, gzipSync(Buffer.from(`${jsonl}\n`, "utf8")));
  return p;
}

describe("import-outcomes ledger", () => {
  it("no record for a claim = absent (legacy behavior upstream)", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-empty-"));
    const store = await MemoryStore.initStore(root);
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.size).toBe(0);
  });

  it("records are keyed by content (claimKey), not by path alone", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-claim-"));
    const store = await MemoryStore.initStore(root);
    await recordImportOutcome(store, {
      targetPath: "memory/pattern-a.md",
      body: "version one\n",
      outcome: "refused",
      reason: "CAS_CONFLICT",
    });
    await recordImportOutcome(store, {
      targetPath: "memory/pattern-a.md",
      body: "version two\n",
      outcome: "landed",
    });
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.size).toBe(2);
    // both records exist independently — a refusal on one body never shadows a
    // different, still-live body at the same path
    const { claimKey } = await import("../src/dream/run.js");
    expect(outcomes.get(claimKey("memory/pattern-a.md", "version one\n"))).toBe("refused");
    expect(outcomes.get(claimKey("memory/pattern-a.md", "version two\n"))).toBe("landed");
  });

  it("a corrupt ledger line loses only that line's contribution", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-corrupt-"));
    const store = await MemoryStore.initStore(root);
    await recordImportOutcome(store, {
      targetPath: "memory/pattern-a.md",
      body: "good\n",
      outcome: "landed",
    });
    const buf = await store.read("efficacy/import-outcomes.jsonl");
    await store.commitOperational({
      relativePath: "efficacy/import-outcomes.jsonl",
      body: `${buf?.toString("utf8") ?? ""}not-json\n`,
      scanSecrets: false,
    });
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.size).toBe(1);
  });
});

describe("review.ts wires accept/reject into the import-outcome ledger", () => {
  const NOTE_BODY = "---\ntitle: t\ndescription: d\n---\n\nbody\n";

  it("a successful accept records LANDED for the exact proposal body", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-accept-"));
    const store = await MemoryStore.initStore(root);
    await store.commitOperational({
      relativePath: "proposals/p1.json",
      body: JSON.stringify({
        id: "p1",
        action: "create",
        targetPath: "memory/x.md",
        base_hash: "absent",
        body: NOTE_BODY,
        evidence: [],
        createdAt: new Date().toISOString(),
      }),
      scanSecrets: false,
    });
    await acceptProposal(store, "p1");
    const { claimKey } = await import("../src/dream/run.js");
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.get(claimKey("memory/x.md", NOTE_BODY))).toBe("landed");
  });

  it("a failed accept (CAS conflict) records REFUSED, not LANDED", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-refuse-"));
    const store = await MemoryStore.initStore(root);
    await store.commitOperational({
      relativePath: "proposals/p2.json",
      body: JSON.stringify({
        id: "p2",
        action: "create",
        targetPath: "memory/x.md",
        base_hash: "not-the-real-hash",
        body: NOTE_BODY,
        evidence: [],
        createdAt: new Date().toISOString(),
      }),
      scanSecrets: false,
    });
    await expect(acceptProposal(store, "p2")).rejects.toThrow();
    const { claimKey } = await import("../src/dream/run.js");
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.get(claimKey("memory/x.md", NOTE_BODY))).toBe("refused");
  });

  it("a human reject records REFUSED for that exact claim", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-reject-"));
    const store = await MemoryStore.initStore(root);
    await store.commitOperational({
      relativePath: "proposals/p3.json",
      body: JSON.stringify({
        id: "p3",
        action: "create",
        targetPath: "memory/x.md",
        base_hash: "absent",
        body: NOTE_BODY,
        evidence: [],
        createdAt: new Date().toISOString(),
      }),
      scanSecrets: false,
    });
    await rejectProposal(store, "p3", "not useful");
    const { claimKey } = await import("../src/dream/run.js");
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.get(claimKey("memory/x.md", NOTE_BODY))).toBe("refused");
  });
});

describe("portability.ts wires import rows into the import-outcome ledger", () => {
  it("a successful memory/ row via `import` records LANDED", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-portability-"));
    const store = await MemoryStore.initStore(root);
    const body = "---\ntitle: t\ndescription: d\n---\n\nbody\n";
    const archive = await archiveWith([{ path: "memory/y.md", body }]);
    const r = await importStore(store, archive, "merge");
    expect(r.imported).toBe(1);
    const { claimKey } = await import("../src/dream/run.js");
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.get(claimKey("memory/y.md", body))).toBe("landed");
  });

  it("a refused memory/ row (secret hit) records REFUSED, never LANDED", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-portability-refuse-"));
    const store = await MemoryStore.initStore(root);
    const body = "AKIAIOSFODNN7EXAMPLE\n";
    const archive = await archiveWith([{ path: "memory/leak.md", body }]);
    const r = await importStore(store, archive, "merge");
    expect(r.rejected).toBe(1);
    const { claimKey } = await import("../src/dream/run.js");
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.get(claimKey("memory/leak.md", body))).toBe("refused");
  });

  it("direct commitCanonical (not via `import`) writes no ledger entry — legacy behavior", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-imp-direct-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/y.md",
      body: "---\ntitle: t\ndescription: d\n---\n\nbody\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const outcomes = await loadImportOutcomes(store);
    expect(outcomes.size).toBe(0);
  });
});
