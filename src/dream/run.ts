import { createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config.js";
import type { Transcript } from "../corpus/types.js";
import { parseFrontmatter } from "../frontmatter.js";
import { SecretDetected, scan } from "../secrets.js";
import type { MemoryStore } from "../store.js";
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

export function extractProposals(
  transcripts: Transcript[],
  storeHashes: Map<string, string>,
): Proposal[] {
  const out: Proposal[] = [];
  for (const t of transcripts) {
    for (const turn of t.turns) {
      if (turn.role !== "user" && turn.role !== "human") continue;
      const text = turn.text.trim();
      const pref = text.match(/(?:please remember|always|prefer|from now on)[:\s]+(.{10,200})/i);
      if (!pref) continue;
      const body = `---\ntitle: Preference\ndescription: ${pref[1].slice(0, 80)}\n---\n\n${pref[1].trim()}\n`;
      const targetPath = `memory/pref-${createHash("sha256")
        .update(pref[1])
        .digest("hex")
        .slice(0, 8)}.md`;
      const draft = {
        action: "create" as const,
        targetPath,
        base_hash: storeHashes.get(targetPath) ?? "absent",
        body,
        evidence: [{ transcriptId: t.id, quote: pref[1].slice(0, 120) }],
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

export async function runDream(
  store: MemoryStore,
  transcripts: Transcript[],
  counts: {
    scanned: number;
    included: number;
    excluded_permission: number;
  },
): Promise<{ proposals: Proposal[]; withheldSecrets: number; dropped: number }> {
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
  let proposals = [
    ...extractProposals(scoped, hashes),
    ...(await staleExpireProposals(store, hashes, 90 * 24 * 3600 * 1000)),
  ];
  let dropped = policyDropped;
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
  return { proposals: kept, withheldSecrets, dropped };
}
