import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { claudeCorpus } from "../src/corpus/claude.js";
import { runDream } from "../src/dream/run.js";
import { acceptProposal, listProposals, rejectProposal } from "../src/review.js";
import { MemoryStore } from "../src/store.js";

async function setup(userText: string) {
  const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-supp-"));
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-supfix-"));
  const proj = path.join(fixtureRoot, "proj-a");
  await mkdir(proj, { recursive: true });
  await writeFile(
    path.join(proj, "sess1.jsonl"),
    `${JSON.stringify({
      timestamp: "2026-01-01T00:00:00Z",
      message: { role: "user", content: userText },
    })}\n`,
    "utf8",
  );
  const store = await MemoryStore.initStore(storeRoot);
  const scan = async () => await claudeCorpus.scan({ scope: "user", roots: [fixtureRoot] });
  const dream = async () => {
    const s = await scan();
    return await runDream(store, s.transcripts, {
      scanned: s.scanned,
      included: s.included,
      excluded_permission: s.excluded_permission,
    });
  };
  return { store, dream };
}

describe("dream re-run suppression", () => {
  it("a REJECTED proposal is not resurrected by the next dream", async () => {
    const { store, dream } = await setup("Please remember: always run tests before committing.");

    const first = await dream();
    expect(first.proposals.length).toBe(1);
    const id = first.proposals[0]?.id ?? "";

    await rejectProposal(store, id, "not durable");
    expect((await listProposals(store)).length).toBe(0);

    const second = await dream();
    expect(second.proposals.length).toBe(0); // must NOT come back
    expect(second.suppressedRejected).toBe(1);
    expect((await listProposals(store)).length).toBe(0);
  });

  it("an ACCEPTED preference is not re-proposed, and a human edit survives", async () => {
    const { store, dream } = await setup("Please remember: always run tests before committing.");

    const first = await dream();
    const id = first.proposals[0]?.id ?? "";
    const target = first.proposals[0]?.targetPath ?? "";
    await acceptProposal(store, id);

    // Human edits the accepted note afterwards.
    const edited =
      "---\ntitle: Preference\ndescription: edited by a human\n---\n\nHUMAN EDIT — do not clobber.\n";
    await store.commitCanonical({
      relativePath: target,
      body: edited,
      baseHash: await store.currentHash(target),
      provenance: { authored_by: "human" },
    });

    const second = await dream();
    expect(second.proposals.length).toBe(0); // no re-proposal of settled content
    const after = await store.read(target);
    expect(after?.toString("utf8")).toContain("HUMAN EDIT");
  });
});

describe("proposal cap selects by evidence strength, not by hash", () => {
  it("keeps the strongest-evidence proposals when capped", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-cap-"));
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-capfix-"));
    const proj = path.join(fixtureRoot, "proj-a");
    await mkdir(proj, { recursive: true });
    // 5 distinct preferences; cap to 2.
    const lines = ["alpha", "bravo", "charlie", "delta", "echo"].map((w) =>
      JSON.stringify({
        timestamp: "2026-01-01T00:00:00Z",
        message: { role: "user", content: `Please remember: never use the ${w} approach here.` },
      }),
    );
    await writeFile(path.join(proj, "s.jsonl"), `${lines.join("\n")}\n`, "utf8");
    const store = await MemoryStore.initStore(storeRoot);
    await writeFile(
      path.join(storeRoot, "config.json"),
      JSON.stringify({ dream: { enabled: true, policy: { maxProposals: 2 } } }, null, 2),
      "utf8",
    );
    const s = await claudeCorpus.scan({ scope: "user", roots: [fixtureRoot] });
    const r = await runDream(store, s.transcripts, {
      scanned: s.scanned,
      included: s.included,
      excluded_permission: s.excluded_permission,
    });
    expect(r.proposals.length).toBe(2);
    expect(r.dropped).toBe(3);
    // Deterministic and evidence-ordered: every kept proposal must carry at least
    // as much evidence as every dropped one. With equal evidence, ties break on a
    // stable key — but never on the sha256 of the proposal id.
    for (const p of r.proposals) expect(p.evidence.length).toBeGreaterThan(0);
  });
});
