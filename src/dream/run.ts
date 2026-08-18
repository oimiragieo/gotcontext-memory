import { createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config.js";
import type { Transcript } from "../corpus/types.js";
import { parseFrontmatter } from "../frontmatter.js";
import { SecretDetected, scan } from "../secrets.js";
import type { MemoryStore } from "../store.js";
import { type PrevalencePattern, type SessionDigest, minePrevalence } from "./digest.js";
import { applyDreamPolicy } from "./policy.js";

export type ProposalAction = "create" | "update" | "supersede" | "expire" | "delete";

export type Proposal = {
  id: string;
  action: ProposalAction;
  targetPath: string;
  base_hash: string;
  body: string;
  evidence: Array<{ transcriptId: string; quote: string }>;
  createdAt: string;
  expiresAt?: string;
};

export function proposalId(p: Omit<Proposal, "id" | "createdAt" | "expiresAt">): string {
  const material = JSON.stringify({
    action: p.action,
    targetPath: p.targetPath,
    base_hash: p.base_hash,
    body: p.body,
    evidenceQuotes: p.evidence.map((e) => e.quote),
  });
  return createHash("sha256").update(material).digest("hex").slice(0, 16);
}

/** YAML-safe scalar: JSON string quoting is valid YAML and closes the injection/
 * breakage hole of interpolating raw text after `description:` — an ordinary colon
 * in a signal key ("eisdir: illegal operation…") made the whole note unparseable. */
function yamlScalar(v: string): string {
  return JSON.stringify(v);
}

/** Stable identity of a proposal's CLAIM, independent of base_hash.
 *
 * base_hash changes the moment the target exists, so it must not participate in
 * suppression: keying on it let an accepted or rejected claim return under a new id
 * on the very next run. */
export function claimKey(targetPath: string, body: string): string {
  return `${targetPath}::${createHash("sha256").update(body).digest("hex").slice(0, 16)}`;
}

/**
 * Claims the council/human already settled. Without this the regex brain is a
 * resurrection machine: extraction is deterministic over the same transcripts, so a
 * rejected claim reappears — byte-identical — on every subsequent run, forever.
 */
export async function loadSuppressedClaims(store: MemoryStore): Promise<Set<string>> {
  const out = new Set<string>();
  const dir = path.join(store.root, "proposals", "rejected");
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const buf = await store.read(`proposals/rejected/${name}`);
      if (!buf) continue;
      const p = JSON.parse(buf.toString("utf8")) as Proposal;
      if (p?.targetPath && typeof p.body === "string") {
        out.add(claimKey(p.targetPath, p.body));
      }
    } catch {
      // A hand-edited or truncated archive entry must not take the dream down;
      // it only means that one claim is no longer suppressed.
    }
  }
  return out;
}

export function extractProposals(
  transcripts: Transcript[],
  storeHashes: Map<string, string>,
  opts: { suppressed?: Set<string>; onSuppressed?: () => void } = {},
): Proposal[] {
  const out: Proposal[] = [];
  const seen = new Set<string>();
  for (const t of transcripts) {
    for (const turn of t.turns) {
      if (turn.role !== "user" && turn.role !== "human") continue;
      const text = turn.text.trim();
      // Require explicit remember / from-now-on anchors (not bare always/prefer).
      const pref = text.match(/(?:please remember|from now on)[:\s]+(.{10,200})/i);
      if (!pref) continue;
      const span = pref[1].trim();
      if (/\b(?:pong|ping)\b|\/health/i.test(span)) continue;
      const body = `---\ntitle: Preference\ndescription: ${yamlScalar(span.slice(0, 80))}\n---\n\n${span}\n`;
      const targetPath = `memory/pref-${createHash("sha256")
        .update(span)
        .digest("hex")
        .slice(0, 8)}.md`;
      // SETTLED: the note already exists, so this claim was accepted on an earlier
      // run. Re-proposing "create" over it would overwrite the live file with the
      // regex-derived body — silently reverting any human edit made since.
      if (storeHashes.has(targetPath)) continue;
      const key = claimKey(targetPath, body);
      if (opts.suppressed?.has(key)) {
        opts.onSuppressed?.();
        continue;
      }
      if (seen.has(key)) continue; // same claim twice in one corpus
      seen.add(key);
      const draft = {
        action: "create" as const,
        targetPath,
        base_hash: storeHashes.get(targetPath) ?? "absent",
        body,
        evidence: [{ transcriptId: t.id, quote: span.slice(0, 120) }],
      };
      out.push({
        ...draft,
        id: proposalId(draft),
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

async function loadStoreHashes(store: MemoryStore): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const memDir = path.join(store.root, "memory");
  const walk = async (dir: string, prefix: string) => {
    let ents: Dirent[];
    try {
      ents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      const rel = path.posix.join(prefix, e.name);
      if (e.isDirectory()) await walk(abs, rel);
      else if (e.name.endsWith(".md")) {
        map.set(rel, await store.currentHash(rel));
      }
    }
  };
  await walk(memDir, "memory");
  return map;
}

async function staleExpireProposals(
  store: MemoryStore,
  storeHashes: Map<string, string>,
  thresholdMs: number,
): Promise<Proposal[]> {
  const out: Proposal[] = [];
  const now = Date.now();
  for (const [rel, hash] of storeHashes) {
    const buf = await store.read(rel);
    if (!buf) continue;
    const { frontmatter } = parseFrontmatter(buf.toString("utf8"));
    const updated = frontmatter.updatedAt ?? frontmatter.createdAt;
    if (typeof updated !== "string") continue;
    const ts = Date.parse(updated);
    if (Number.isNaN(ts) || now - ts < thresholdMs) continue;
    const draft = {
      action: "expire" as const,
      targetPath: rel,
      base_hash: hash,
      body: buf.toString("utf8"),
      evidence: [
        {
          transcriptId: "staleness-pass",
          quote: `No incoming evidence; older than threshold (${updated})`,
        },
      ],
    };
    out.push({
      ...draft,
      id: proposalId(draft),
      createdAt: new Date().toISOString(),
    });
  }
  return out;
}

/**
 * Proposals from CROSS-SESSION prevalence — the capability a per-transcript regex
 * cannot express. A claim carries the count of DISTINCT sessions it was observed in
 * plus cited line numbers, so a reviewer can check it rather than take it on trust.
 * Prevalence is counted, never asserted.
 */
export function proposalsFromPatterns(
  patterns: PrevalencePattern[],
  storeHashes: Map<string, string>,
  opts: { suppressed?: Set<string>; onSuppressed?: () => void; minSessions?: number } = {},
): Proposal[] {
  const out: Proposal[] = [];
  for (const pat of patterns) {
    if (pat.kind === "preference") continue; // handled by the preference extractor
    const slug = createHash("sha256").update(`${pat.kind}:${pat.key}`).digest("hex").slice(0, 8);
    const targetPath = `memory/pattern-${slug}.md`;
    const cites = pat.citations
      .map((c) => `- ${c.session} line ${c.line}: ${c.snip.replace(/\s+/g, " ").slice(0, 140)}`)
      .join("\n");
    const body =
      `---\ntitle: Recurring ${pat.kind.replace(/_/g, " ")}\n` +
      `description: ${yamlScalar(`seen in ${pat.k}/${pat.n} sessions — ${pat.key.slice(0, 60)}`)}\n` +
      // createdAt makes the note self-dating for the efficacy loop even when the
      // accepted-proposal archive is missing (exported store, hand-copied note).
      `createdAt: ${new Date().toISOString()}\n---\n\n` +
      `**Pattern:** ${pat.key}\n\n` +
      `**Prevalence:** ${pat.k}/${pat.n} sessions (${pat.occurrences} occurrences)\n\n` +
      `**Sessions:** ${pat.sessions.join(", ")}\n\n` +
      `**Evidence:**\n${cites}\n`;
    if (storeHashes.has(targetPath)) continue;
    const key = claimKey(targetPath, body);
    if (opts.suppressed?.has(key)) {
      opts.onSuppressed?.();
      continue;
    }
    const draft = {
      action: "create" as const,
      targetPath,
      base_hash: storeHashes.get(targetPath) ?? "absent",
      body,
      evidence: pat.citations.map((c) => ({
        transcriptId: c.session,
        quote: c.snip.slice(0, 120),
      })),
    };
    out.push({ ...draft, id: proposalId(draft), createdAt: new Date().toISOString() });
  }
  return out;
}

/**
 * Digest-based dream: the streaming path. Takes bounded SessionDigests rather than
 * fully-parsed transcripts, so corpus size no longer bounds whether the dream runs
 * at all (the machine this was designed against holds 9.6 GB / 11,683 transcripts,
 * including one 2.3 GB file that exceeds V8's max string length).
 */
export async function runDreamFromDigests(
  store: MemoryStore,
  digests: SessionDigest[],
  counts: { scanned: number; included: number; excluded_permission: number },
): Promise<{
  proposals: Proposal[];
  withheldSecrets: number;
  dropped: number;
  suppressedRejected: number;
  patterns: number;
}> {
  const before = await store.memoryTreeHash();
  const cfg = await loadConfig(store.root);
  if (digests.length === 0) {
    // A permission-dominated zero is a SCOPING outcome, not a broken install —
    // and a first-run user cannot tell the difference from the counts alone
    // (dogfooded 2026-08-18: `dream --store project` in a fresh directory
    // excluded all 8,379 transcripts and the message offered no way out).
    const hint =
      counts.excluded_permission > 0 && counts.excluded_permission >= counts.scanned
        ? " — every transcript was excluded by project scoping: a project store " +
          "reads only sessions recorded for THIS directory's project. Run from " +
          "the project directory the sessions belong to, or use `--store user` " +
          "for a cross-project dream."
        : "";
    const err = new Error(
      `EMPTY_CORPUS — proves nothing; scanned=${counts.scanned} included=${counts.included} excluded_permission=${counts.excluded_permission}${hint}`,
    );
    err.name = "EmptyCorpus";
    throw err;
  }
  const hashes = await loadStoreHashes(store);
  const suppressed = await loadSuppressedClaims(store);
  let suppressedRejected = 0;
  const onSuppressed = () => {
    suppressedRejected += 1;
  };

  const patterns = minePrevalence(digests, { minSessions: 2 });
  const prefProposals: Proposal[] = [];
  for (const d of digests) {
    for (const pref of d.preferences) {
      const span = pref.span;
      const body = `---\ntitle: Preference\ndescription: ${yamlScalar(span.slice(0, 80))}\n---\n\n${span}\n`;
      const targetPath = `memory/pref-${createHash("sha256")
        .update(span)
        .digest("hex")
        .slice(0, 8)}.md`;
      if (hashes.has(targetPath)) continue;
      const key = claimKey(targetPath, body);
      if (suppressed.has(key)) {
        onSuppressed();
        continue;
      }
      if (prefProposals.some((p) => p.targetPath === targetPath)) continue;
      const draft = {
        action: "create" as const,
        targetPath,
        base_hash: "absent",
        body,
        evidence: [{ transcriptId: d.id, quote: span.slice(0, 120) }],
      };
      prefProposals.push({ ...draft, id: proposalId(draft), createdAt: new Date().toISOString() });
    }
  }

  let proposals = [
    ...prefProposals,
    ...proposalsFromPatterns(patterns, hashes, { suppressed, onSuppressed }),
  ];
  let dropped = 0;
  proposals.sort(
    (a, b) =>
      b.evidence.length - a.evidence.length ||
      a.targetPath.localeCompare(b.targetPath) ||
      a.id.localeCompare(b.id),
  );
  const max = cfg.dream.policy.maxProposals;
  if (max != null && proposals.length > max) {
    dropped += proposals.length - max;
    proposals = proposals.slice(0, max);
  }

  const { kept, withheldSecrets } = await persistProposals(store, proposals);
  const after = await store.memoryTreeHash();
  if (after !== before) {
    throw new Error("Dream mutated canonical memoryTreeHash — abort");
  }
  return {
    proposals: kept,
    withheldSecrets,
    dropped,
    suppressedRejected,
    patterns: patterns.length,
  };
}

/** Secret-scan then persist; shared by both dream entry points. */
async function persistProposals(
  store: MemoryStore,
  proposals: Proposal[],
): Promise<{ kept: Proposal[]; withheldSecrets: number }> {
  let withheldSecrets = 0;
  const kept: Proposal[] = [];
  const allow = store.getSecretAllowlist();
  for (const p of proposals) {
    try {
      const blob = p.body + p.evidence.map((e) => e.quote).join("\n");
      if (scan(blob, allow).length) {
        withheldSecrets += 1;
        continue;
      }
      await store.commitOperational({
        relativePath: `proposals/${p.id}.json`,
        body: `${JSON.stringify(p, null, 2)}\n`,
      });
      kept.push(p);
    } catch (err) {
      if (err instanceof SecretDetected) {
        withheldSecrets += 1;
        continue;
      }
      throw err;
    }
  }
  return { kept, withheldSecrets };
}

export async function runDream(
  store: MemoryStore,
  transcripts: Transcript[],
  counts: {
    scanned: number;
    included: number;
    excluded_permission: number;
  },
): Promise<{
  proposals: Proposal[];
  withheldSecrets: number;
  dropped: number;
  suppressedRejected: number;
}> {
  const before = await store.memoryTreeHash();
  const cfg = await loadConfig(store.root);
  const { kept: scoped, dropped: policyDropped } = applyDreamPolicy(transcripts, cfg.dream.policy);

  if (scoped.length === 0) {
    const err = new Error(
      `EMPTY_CORPUS — proves nothing; scanned=${counts.scanned} included=${counts.included} excluded_permission=${counts.excluded_permission}`,
    );
    err.name = "EmptyCorpus";
    throw err;
  }

  const hashes = await loadStoreHashes(store);
  const suppressed = await loadSuppressedClaims(store);
  let suppressedRejected = 0;
  let proposals = [
    ...extractProposals(scoped, hashes, {
      suppressed,
      onSuppressed: () => {
        suppressedRejected += 1;
      },
    }),
    ...(await staleExpireProposals(store, hashes, 90 * 24 * 3600 * 1000)),
  ];
  let dropped = policyDropped;
  // Order by EVIDENCE STRENGTH, then by a stable tiebreak. Sorting by proposal id
  // ordered by a sha256 prefix, so a cap kept an arbitrary subset — the survivors
  // were chosen by hash, not by how well-evidenced they were.
  proposals.sort(
    (a, b) =>
      b.evidence.length - a.evidence.length ||
      a.targetPath.localeCompare(b.targetPath) ||
      a.id.localeCompare(b.id),
  );
  if (cfg.dream.policy.maxProposals != null) {
    const max = cfg.dream.policy.maxProposals;
    if (proposals.length > max) {
      dropped += proposals.length - max;
      proposals = proposals.slice(0, max);
    }
  }

  let withheldSecrets = 0;
  const kept: Proposal[] = [];
  const allow = store.getSecretAllowlist();
  for (const p of proposals) {
    try {
      const blob = p.body + p.evidence.map((e) => e.quote).join("\n");
      const findings = scan(blob, allow);
      if (findings.length) {
        withheldSecrets += 1;
        continue;
      }
      await store.commitOperational({
        relativePath: `proposals/${p.id}.json`,
        body: `${JSON.stringify(p, null, 2)}\n`,
      });
      kept.push(p);
    } catch (err) {
      if (err instanceof SecretDetected) {
        withheldSecrets += 1;
        continue;
      }
      throw err;
    }
  }
  const after = await store.memoryTreeHash();
  if (after !== before) {
    throw new Error("Dream mutated canonical memoryTreeHash — abort");
  }
  return { proposals: kept, withheldSecrets, dropped, suppressedRejected };
}
