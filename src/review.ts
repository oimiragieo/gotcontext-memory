import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Proposal, ProposalAction } from "./dream/run.js";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { sha256Hex } from "./hash.js";
import { regenerateIndex } from "./index.js";
import { assertSafeRelativePath } from "./paths.js";
import { SecretDetected, scan } from "./secrets.js";
import { BASE_ABSENT, CasConflict, type MemoryStore, checkIndexCaps } from "./store.js";

const ALLOWED_ACTIONS = new Set<ProposalAction>([
  "create",
  "update",
  "supersede",
  "expire",
  "delete",
]);

/** Proposal ids are single path segments under proposals/ — never traversal. */
export function assertProposalId(id: string): string {
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(id)) {
    throw new Error(`invalid proposal id: ${id}`);
  }
  assertSafeRelativePath(`proposals/${id}.json`);
  return id;
}

function assertProposalAction(action: string): asserts action is ProposalAction {
  if (!ALLOWED_ACTIONS.has(action as ProposalAction)) {
    throw new Error(`invalid proposal schema: unknown action ${action}`);
  }
}

/**
 * Name the ACTUAL cause. The old default filed everything unrecognised as
 * INDEX_DRIFT_OR_CAS, so a TypeError, a bad schema, or a missing target all told the
 * operator to go reconcile an index that was never the problem. A receipt that names
 * the wrong cause is worse than one that admits it does not know.
 */
function receiptCode(err: unknown): string {
  if (err instanceof CasConflict) return "CAS_CONFLICT";
  if (err instanceof SecretDetected) return "SECRET_DETECTED";
  const name = (err as Error)?.name;
  if (name === "IndexCapExceeded") return "INDEX_CAP";
  const msg = (err as Error)?.message ?? "";
  if (/expire target missing/i.test(msg)) return "TARGET_MISSING";
  if (/invalid proposal|unknown action/i.test(msg)) return "INVALID_PROPOSAL";
  if (/proposal expired/i.test(msg)) return "PROPOSAL_EXPIRED";
  if (/Path containment|escapes store root|Symlink escape/i.test(msg)) return "PATH_VIOLATION";
  return "INTERNAL_ERROR";
}

async function readProposal(store: MemoryStore, id: string): Promise<string> {
  assertProposalId(id);
  const buf = await store.read(`proposals/${id}.json`);
  if (!buf) throw new Error(`proposal not found: ${id}`);
  return buf.toString("utf8");
}

/**
 * One unreadable entry must never make the whole queue unreviewable. The id guard
 * was already tolerant; the JSON.parse was not, so a single hand-edited or truncated
 * proposal threw and took every other pending proposal down with it — leaving no way
 * to list or clean them. Bad entries are reported, not fatal.
 */
export async function listProposals(
  store: MemoryStore,
  onUnreadable?: (id: string, message: string) => void,
): Promise<Proposal[]> {
  const dir = path.join(store.root, "proposals");
  let ents: string[];
  try {
    ents = await readdir(dir);
  } catch {
    return []; // no proposals dir yet (fresh store, never dreamed)
  }
  const out: Proposal[] = [];
  for (const name of ents) {
    if (!name.endsWith(".json")) continue;
    const id = name.slice(0, -".json".length);
    try {
      assertProposalId(id);
    } catch {
      continue;
    }
    try {
      const raw = await readProposal(store, id);
      out.push(JSON.parse(raw) as Proposal);
    } catch (err) {
      onUnreadable?.(id, (err as Error).message);
    }
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
    body: `${JSON.stringify({ ...JSON.parse(raw), reason }, null, 2)}\n`,
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
  assertProposalAction(proposal.action);
  if (proposal.expiresAt != null && proposal.expiresAt !== "") {
    const exp = Date.parse(proposal.expiresAt);
    if (Number.isNaN(exp)) {
      throw new Error(`proposal expiresAt invalid: ${id}`);
    }
    if (exp < Date.now()) {
      throw new Error(`proposal expired: ${id}`);
    }
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

  // Preflight: secrets + caps (best-effort; re-checked under lock with fresh index)
  const targetBody = expireBody ?? overlayUpserts[proposal.targetPath] ?? proposal.body;
  if (proposal.action !== "delete") {
    const findings = scan(targetBody, store.getSecretAllowlist());
    if (findings.length) throw new SecretDetected(findings);
  }
  const preflightIndex = await regenerateIndex(store, {
    upserts: overlayUpserts,
    deletes: overlayDeletes,
  });
  checkIndexCaps(preflightIndex);
  const preflightIndexFindings = scan(preflightIndex, store.getSecretAllowlist());
  if (preflightIndexFindings.length) throw new SecretDetected(preflightIndexFindings);

  try {
    await store.withCanonicalLocks([proposal.targetPath, "MEMORY.md"], async (locked) => {
      const targetBefore = await store.read(proposal.targetPath);
      const targetBeforeHash = targetBefore ? sha256Hex(targetBefore) : BASE_ABSENT;
      if (targetBeforeHash !== proposal.base_hash && proposal.action !== "delete") {
        // Early CAS for non-delete; delete uses base_hash inside deleteCanonicalLocked.
        if (
          proposal.action === "create" ||
          proposal.action === "update" ||
          proposal.action === "supersede" ||
          proposal.action === "expire"
        ) {
          if (targetBeforeHash !== proposal.base_hash) {
            throw new CasConflict(targetBeforeHash);
          }
        }
      }

      // Rebuild expire body under lock from live bytes (DD-DREAM-008).
      let lockedExpireBody = expireBody;
      if (proposal.action === "expire") {
        const existing = await store.read(proposal.targetPath);
        if (!existing) throw new Error(`expire target missing: ${proposal.targetPath}`);
        const { frontmatter, body } = parseFrontmatter(existing.toString("utf8"));
        frontmatter.expires = new Date().toISOString();
        lockedExpireBody = serializeFrontmatter(frontmatter, body);
        overlayUpserts[proposal.targetPath] = lockedExpireBody;
      }

      if (proposal.action === "delete") {
        const base = proposal.base_hash === "absent" ? BASE_ABSENT : proposal.base_hash;
        await locked.deleteCanonicalLocked({
          relativePath: proposal.targetPath,
          baseHash: base,
          provenance: { authored_by: "dream", proposal_id: id },
        });
      } else if (proposal.action === "expire") {
        if (lockedExpireBody === null) {
          throw new Error(`expire body missing for proposal ${id}`);
        }
        await locked.commitCanonicalLocked({
          relativePath: proposal.targetPath,
          body: lockedExpireBody,
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

      // Rebuild MEMORY.md from live tree under the same locks (DD-DREAM-001).
      const indexBytes = await regenerateIndex(store, {
        upserts: {},
        deletes: [],
      });
      checkIndexCaps(indexBytes);
      const indexFindings = scan(indexBytes, store.getSecretAllowlist());
      if (indexFindings.length) throw new SecretDetected(indexFindings);

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
        throw indexErr;
      }
    });
  } catch (err) {
    await store.commitOperational({
      relativePath: `receipts/${id}.error.json`,
      body: `${JSON.stringify({
        id,
        status: "error",
        code: receiptCode(err),
        message: (err as Error).message,
        at: new Date().toISOString(),
      })}\n`,
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
    body: `${JSON.stringify({
      id,
      status: "accepted",
      at: new Date().toISOString(),
    })}\n`,
    scanSecrets: false,
  });
}
