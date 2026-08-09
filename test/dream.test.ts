import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { claudeCorpus } from "../src/corpus/claude.js";
import { runDream } from "../src/dream/run.js";
import { regenerateIndex } from "../src/index.js";
import {
  acceptProposal,
  listProposals,
  rejectProposal,
} from "../src/review.js";
import { IndexCapExceeded, BASE_ABSENT, MemoryStore } from "../src/store.js";
import { checkIndexCaps } from "../src/store.js";

describe("corpus + dream + review", () => {
  it("claude importer zero sessions returns EMPTY label", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-corp-"));
    const r = await claudeCorpus.scan({
      scope: "user",
      roots: [root],
    });
    expect(r.label).toBe("EMPTY");
    expect(r.scanned).toBe(0);
    expect(r.transcripts).toEqual([]);
  });

  it("dream leaves memoryTreeHash identical; reject keeps it identical", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-dream-"));
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-fix-"));
    const proj = path.join(fixtureRoot, "proj-a");
    await mkdir(proj, { recursive: true });
    await writeFile(
      path.join(proj, "sess1.jsonl"),
      `${JSON.stringify({
        timestamp: "2026-01-01T00:00:00Z",
        message: {
          role: "user",
          content: "Please remember: always run tests before committing.",
        },
      })}\n`,
      "utf8",
    );
    const store = await MemoryStore.initStore(storeRoot);
    const before = await store.memoryTreeHash();
    const scanned = await claudeCorpus.scan({
      scope: "user",
      roots: [fixtureRoot],
    });
    const { proposals } = await runDream(store, scanned.transcripts, {
      scanned: scanned.scanned,
      included: scanned.included,
      excluded_permission: scanned.excluded_permission,
    });
    expect(await store.memoryTreeHash()).toBe(before);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
    await rejectProposal(store, proposals[0]!.id, "nope");
    expect(await store.memoryTreeHash()).toBe(before);
    expect(await listProposals(store)).toHaveLength(0);
  });

  it("accept commits via CAS, updates MEMORY.md, removes pending proposal", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-acc-"));
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-fix2-"));
    const proj = path.join(fixtureRoot, "proj-a");
    await mkdir(proj, { recursive: true });
    await writeFile(
      path.join(proj, "sess1.jsonl"),
      `${JSON.stringify({
        timestamp: "2026-01-01T00:00:00Z",
        message: {
          role: "user",
          content: "Please remember: prefer conventional commits.",
        },
      })}\n`,
      "utf8",
    );
    const store = await MemoryStore.initStore(storeRoot);
    const scanned = await claudeCorpus.scan({
      scope: "user",
      roots: [fixtureRoot],
    });
    const { proposals } = await runDream(store, scanned.transcripts, {
      scanned: scanned.scanned,
      included: scanned.included,
      excluded_permission: scanned.excluded_permission,
    });
    const p = proposals[0]!;
    await acceptProposal(store, p.id);
    const mem = await store.read(p.targetPath);
    expect(mem).not.toBeNull();
    const index = await store.read("MEMORY.md");
    expect(index!.toString("utf8")).toContain(p.targetPath);
    expect(await listProposals(store)).toHaveLength(0);
  });

  it("regenerateIndex is pure and deterministic; caps reject oversized index", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-idx-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "---\ntitle: A\ndescription: alpha\n---\n\nbody\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const a = await regenerateIndex(store);
    const b = await regenerateIndex(store);
    expect(a).toBe(b);
    expect(a).toContain("memory/a.md");
    const huge = "# Memory index\n\n" + "x".repeat(30_000);
    expect(() => checkIndexCaps(huge)).toThrow(IndexCapExceeded);
  });

  it("accept preflight refuses index over cap without mutating memory", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-cap-"));
    const store = await MemoryStore.initStore(storeRoot);
    // Fill index near cap via many memory files would be slow; inject proposal that would blow index
    const body = "---\ntitle: Big\ndescription: x\n---\n\n" + "y".repeat(100);
    // Create many tiny memories to push regenerateIndex over line cap
    for (let i = 0; i < 210; i++) {
      await store.commitCanonical({
        relativePath: `memory/n${i}.md`,
        body: `---\ntitle: N${i}\ndescription: d\n---\n\nz\n`,
        baseHash: BASE_ABSENT,
        provenance: { authored_by: "human" },
      });
    }
    const before = await store.memoryTreeHash();
    const proposal = {
      id: "captest",
      action: "create" as const,
      targetPath: "memory/extra.md",
      base_hash: "absent",
      body,
      evidence: [{ transcriptId: "t", quote: "q" }],
      createdAt: new Date().toISOString(),
    };
    await store.commitOperational({
      relativePath: `proposals/${proposal.id}.json`,
      body: JSON.stringify(proposal, null, 2),
      scanSecrets: false,
    });
    await expect(acceptProposal(store, "captest")).rejects.toBeInstanceOf(
      IndexCapExceeded,
    );
    expect(await store.memoryTreeHash()).toBe(before);
  });

  it("policy excluding source cursor drops cursor transcripts; control keeps them", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-pol-"));
    const store = await MemoryStore.initStore(storeRoot);
    await writeFile(
      path.join(storeRoot, "config.json"),
      JSON.stringify({
        dream: {
          enabled: false,
          policy: { excludeSources: ["cursor"] },
        },
        memory: { policy: {} },
        secrets: { allowlist: [] },
      }) + "\n",
    );
    await store.reloadConfig();
    const transcripts = [
      {
        id: "c1",
        source: "cursor",
        path: "/x",
        scope: "user" as const,
        turns: [
          {
            role: "user",
            text: "Please remember: exclude me from dream.",
            tool_events: [],
            skill_invocations: [],
          },
        ],
      },
      {
        id: "a1",
        source: "claude",
        path: "/y",
        scope: "user" as const,
        turns: [
          {
            role: "user",
            text: "Please remember: keep this preference.",
            tool_events: [],
            skill_invocations: [],
          },
        ],
      },
    ];
    const { proposals } = await runDream(store, transcripts, {
      scanned: 2,
      included: 2,
      excluded_permission: 0,
    });
    expect(
      proposals.every((p) => !p.evidence.some((e) => e.transcriptId === "c1")),
    ).toBe(true);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
  });
});
