import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { regenerateIndex } from "./index.js";
import type { Proposal } from "./dream/run.js";
import { assertSafeRelativePath } from "./paths.js";
import { scan, SecretDetected } from "./secrets.js";
import {
  BASE_ABSENT,
  checkIndexCaps,
  MemoryStore,
} from "./store.js";

/** Proposal ids are single path segments under proposals/ — never traversal. */
export function assertProposalId(id: string): string {
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(id)) {
    throw new Error(`invalid proposal id: ${id}`);
  }
  assertSafeRelativePath(`proposals/${id}.json`);
  return id;
}

async function readProposal(store: MemoryStore, id: string): Promise<string> {
  assertProposalId(id);
  const buf = await store.read(`proposals/${id}.json`);
  if (!buf) throw new Error(`proposal not found: ${id}`);
  return buf.toString("utf8");
}

export async function listProposals(store: MemoryStore): Promise<Proposal[]> {
  const dir = path.join(store.root, "proposals");
  const ents = await readdir(dir);
  const out: Proposal[] = [];
  for (const name of ents) {
    if (!name.endsWith(".json")) continue;
    const id = name.slice(0, -".json".length);
    try {
      assertProposalId(id);
    } catch {
      continue;
    }
    const raw = await readProposal(store, id);
    out.push(JSON.parse(raw) as Proposal);
  }
  return out;
}

export async function rejectProposal(
  store: MemoryStore,
  id: string,
  reason: string,
): Promise<void> {
  assertProposalId(id);
  const before = await store.memoryTreeHash();
  const raw = await readProposal(store, id);
  await store.commitOperational({
    relativePath: `proposals/rejected/${id}.json`,
    body: JSON.stringify({ ...JSON.parse(raw), reason }, null, 2) + "\n",
    scanSecrets: false,
  });
  await store.removeOperational(`proposals/${id}.json`);
  const after = await store.memoryTreeHash();
  if (after !== before) throw new Error("reject mutated memoryTreeHash");
}

export async function acceptProposal(
  store: MemoryStore,
  id: string,
  opts: { yesDelete?: boolean } = {},
): Promise<void> {
  assertProposalId(id);
  const raw = await readProposal(store, id);
  const proposal = JSON.parse(raw) as Proposal;

  if (!proposal.targetPath || !proposal.action || !proposal.base_hash) {
    throw new Error("invalid proposal schema");
  }
  if (proposal.expiresAt && Date.parse(proposal.expiresAt) < Date.now()) {
    throw new Error(`proposal expired: ${id}`);
  }
  if (proposal.action === "delete" && !opts.yesDelete) {
    throw new Error("delete requires --yes-delete on a named id");
  }

  const overlayUpserts: Record<string, string> = {};
  const overlayDeletes: string[] = [];
  let expireBody: string | null = null;

  if (
    proposal.action === "create" ||
    proposal.action === "update" ||
    proposal.action === "supersede"
  ) {
    overlayUpserts[proposal.targetPath] = proposal.body;
  } else if (proposal.action === "expire") {
    const existing = await store.read(proposal.targetPath);
    if (!existing) throw new Error(`expire target missing: ${proposal.targetPath}`);
    const { frontmatter, body } = parseFrontmatter(existing.toString("utf8"));
    frontmatter.expires = new Date().toISOString();
    expireBody = serializeFrontmatter(frontmatter, body);
    overlayUpserts[proposal.targetPath] = expireBody;
  } else if (proposal.action === "delete") {
    overlayDeletes.push(proposal.targetPath);
  }

  const indexBytes = await regenerateIndex(store, {
    upserts: overlayUpserts,
    deletes: overlayDeletes,
  });

  // Preflight: secrets + caps before any canonical mutation
  const targetBody =
    expireBody ??
    overlayUpserts[proposal.targetPath] ??
    proposal.body;
  if (proposal.action !== "delete") {
    const findings = scan(targetBody, store.getSecretAllowlist());
    if (findings.length) throw new SecretDetected(findings);
  }
  try {
    checkIndexCaps(indexBytes);
  } catch (err) {
    throw err;
  }
  const indexFindings = scan(indexBytes, store.getSecretAllowlist());
  if (indexFindings.length) throw new SecretDetected(indexFindings);

  try {
    await store.withCanonicalLocks(
      [proposal.targetPath, "MEMORY.md"],
      async (locked) => {
        const targetBefore = await store.read(proposal.targetPath);
        const targetBeforeHash = targetBefore
          ? (await import("./hash.js")).sha256Hex(targetBefore)
          : BASE_ABSENT;

        if (proposal.action === "delete") {
          const base =
            proposal.base_hash === "absent"
              ? BASE_ABSENT
              : proposal.base_hash;
          await locked.deleteCanonicalLocked({
            relativePath: proposal.targetPath,
            baseHash: base,
            provenance: { authored_by: "dream", proposal_id: id },
          });
        } else if (proposal.action === "expire") {
          await locked.commitCanonicalLocked({
            relativePath: proposal.targetPath,
            body: expireBody!,
            baseHash: proposal.base_hash,
            provenance: {
              authored_by: "dream",
              proposal_id: id,
              source: "expire",
            },
          });
        } else {
          await locked.commitCanonicalLocked({
            relativePath: proposal.targetPath,
            body: proposal.body,
            baseHash: proposal.base_hash,
            provenance: { authored_by: "dream", proposal_id: id },
          });
        }
        try {
          const indexHash = await store.currentHash("MEMORY.md");
          await locked.commitCanonicalLocked({
            relativePath: "MEMORY.md",
            body: indexBytes,
            baseHash: indexHash,
            provenance: { authored_by: "system", proposal_id: id },
          });
        } catch (indexErr) {
          // Roll back target so accept never leaves half-applied canonical state.
          const { sha256Hex } = await import("./hash.js");
          if (proposal.action === "delete") {
            if (targetBefore) {
              await locked.commitCanonicalLocked({
                relativePath: proposal.targetPath,
                body: targetBefore.toString("utf8"),
                baseHash: BASE_ABSENT,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            }
          } else {
            const cur = await store.currentHash(proposal.targetPath);
            if (targetBefore) {
              await locked.commitCanonicalLocked({
                relativePath: proposal.targetPath,
                body: targetBefore.toString("utf8"),
                baseHash: cur,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            } else {
              await locked.deleteCanonicalLocked({
                relativePath: proposal.targetPath,
                baseHash: cur,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            }
          }
          void targetBeforeHash;
          void sha256Hex;
          throw indexErr;
        }
      },
    );
  } catch (err) {
    await store.commitOperational({
      relativePath: `receipts/${id}.error.json`,
      body:
        JSON.stringify({
          id,
          status: "error",
          code: "INDEX_DRIFT_OR_CAS",
          message: (err as Error).message,
          at: new Date().toISOString(),
        }) + "\n",
      scanSecrets: false,
    });
    throw err;
  }

  await store.commitOperational({
    relativePath: `proposals/accepted/${id}.json`,
    body: raw,
    scanSecrets: false,
  });
  await store.removeOperational(`proposals/${id}.json`);
  await store.commitOperational({
    relativePath: `receipts/${id}.json`,
    body:
      JSON.stringify({
        id,
        status: "accepted",
        at: new Date().toISOString(),
      }) + "\n",
    scanSecrets: false,
  });
}
