import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "../frontmatter.js";
import type { MemoryStore } from "../store.js";
import { type SessionDigest, signalKey } from "./digest.js";

/**
 * The efficacy loop — the difference between a system that WRITES memory and one
 * that LEARNS. An accepted pattern-note is an implicit claim: "this recurs; keeping
 * it in memory should make it stop." Nothing previously ever checked whether it
 * stopped, so a note could sit in memory forever, neither helping nor being retired.
 *
 * measureEfficacy re-runs the prevalence count for each accepted pattern over the
 * sessions AFTER acceptance and renders a verdict:
 *
 *   RESOLVED           zero recurrences in a sufficient window — candidate for expiry
 *   PERSISTING         still recurring — the note is not preventing it; escalate
 *                      (hook/mechanization) rather than re-remember
 *   INSUFFICIENT_DATA  too few post-acceptance sessions to say anything — a verdict
 *                      from 2 sessions would be noise wearing a label
 *
 * Same honesty rules as the rest of this package: counted, never inferred, and the
 * window that produced each number is part of the result.
 */

export type EfficacyVerdict = "RESOLVED" | "PERSISTING" | "INSUFFICIENT_DATA" | "UNPARSEABLE_NOTE";

export type EfficacyResult = {
  notePath: string;
  kind: string;
  pattern: string;
  acceptedAt: string;
  /** prevalence claimed by the note at acceptance time, when parseable */
  then_k?: number;
  then_n?: number;
  /** recomputed over sessions with sessionTs AFTER acceptance */
  after_k: number;
  after_n: number;
  occurrences: number;
  verdict: EfficacyVerdict;
  /** consecutive scoring runs with this same verdict (history-backed) */
  streak: number;
  /** per-model verdict where that model has >=5 post-acceptance sessions */
  model_verdicts?: Record<string, string>;
  /** PERSISTING on >=2 consecutive runs: the note is not working — the fix is a
   * mechanism, not a re-worded note. This toolkit is harness-agnostic, so this
   * is a RECOMMENDATION field; it never installs anything. */
  recommend_mechanize?: boolean;
};

export type EfficacyOptions = {
  /** RESOLVED on >=2 consecutive runs with an adequate window (n>=15): emit an
   * `expire` PROPOSAL through the normal propose->review flow. A human still
   * accepts — canonical memory is never touched here (HITL preserved). */
  proposeExpiry?: boolean;
};

const HISTORY_PATH = "efficacy/history.jsonl";
/** Below this many post-acceptance sessions, retirement is never proposed. */
export const MIN_EXPIRY_WINDOW = 15;
/** Per-model verdicts require at least this many sessions on that model. */
export const MIN_MODEL_SESSIONS = 5;

/** Post-acceptance sessions below this count → INSUFFICIENT_DATA, never a verdict. */
export const MIN_AFTER_SESSIONS = 5;

const KIND_TO_CHANNELS: Record<string, Array<keyof SessionDigest>> = {
  tool_error: ["toolErrors"],
  hook_block: ["hookBlocks"],
  user_correction: ["userCorrections"],
};

async function acceptedAtFor(store: MemoryStore, targetPath: string): Promise<string | null> {
  // Authoritative source: the accepted-proposal archive carries createdAt and
  // targetPath. Frontmatter createdAt is the fallback for hand-written notes.
  const dir = path.join(store.root, "proposals", "accepted");
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return null;
  }
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const buf = await store.read(`proposals/accepted/${name}`);
      if (!buf) continue;
      const p = JSON.parse(buf.toString("utf8")) as { targetPath?: string; createdAt?: string };
      if (p.targetPath === targetPath && p.createdAt) return p.createdAt;
    } catch {
      // an unreadable archive entry only means this source cannot date the note
    }
  }
  return null;
}

async function loadStreaks(store: MemoryStore): Promise<Record<string, [string, number]>> {
  const out: Record<string, [string, number]> = {};
  const buf = await store.read(HISTORY_PATH);
  if (!buf) return out;
  for (const line of buf.toString("utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line) as { items?: Array<{ notePath: string; verdict: string }> };
      for (const item of rec.items ?? []) {
        const prev = out[item.notePath];
        out[item.notePath] =
          prev && prev[0] === item.verdict ? [item.verdict, prev[1] + 1] : [item.verdict, 1];
      }
    } catch {
      // one corrupt history line only loses that line's contribution
    }
  }
  return out;
}

async function appendHistory(store: MemoryStore, results: EfficacyResult[]): Promise<void> {
  const buf = await store.read(HISTORY_PATH);
  const prior = buf ? buf.toString("utf8") : "";
  const line = `${JSON.stringify({
    date: new Date().toISOString(),
    items: results.map((r) => ({ notePath: r.notePath, verdict: r.verdict })),
  })}\n`;
  await store.commitOperational({
    relativePath: HISTORY_PATH,
    body: prior + line,
    scanSecrets: false,
  });
}

async function proposeExpiryFor(store: MemoryStore, r: EfficacyResult): Promise<boolean> {
  // Idempotence: skip when a pending expire proposal for this note already
  // exists, or the note already carries an `expires` frontmatter field.
  const { listProposals } = await import("../review.js");
  const pending = await listProposals(store);
  if (pending.some((p) => p.action === "expire" && p.targetPath === r.notePath)) return false;
  const buf = await store.read(r.notePath);
  if (!buf) return false;
  const bodyText = buf.toString("utf8");
  try {
    const { frontmatter } = parseFrontmatter(bodyText);
    if (frontmatter.expires != null) return false;
  } catch {
    return false; // unparseable notes are scored UNPARSEABLE_NOTE, never expired blind
  }
  const { proposalId } = await import("./run.js");
  const draft = {
    action: "expire" as const,
    targetPath: r.notePath,
    base_hash: await store.currentHash(r.notePath),
    body: bodyText,
    evidence: [
      {
        transcriptId: "efficacy-loop",
        quote: `RESOLVED x${r.streak}: 0/${r.after_n} post-acceptance sessions`,
      },
    ],
  };
  const proposal = { ...draft, id: proposalId(draft), createdAt: new Date().toISOString() };
  await store.commitOperational({
    relativePath: `proposals/${proposal.id}.json`,
    body: `${JSON.stringify(proposal, null, 2)}\n`,
    scanSecrets: false,
  });
  return true;
}

export async function measureEfficacy(
  store: MemoryStore,
  digests: SessionDigest[],
  opts: EfficacyOptions = {},
): Promise<EfficacyResult[]> {
  const memDir = path.join(store.root, "memory");
  let names: string[];
  try {
    names = await readdir(memDir);
  } catch {
    return [];
  }
  const out: EfficacyResult[] = [];
  for (const name of names) {
    if (!name.startsWith("pattern-") || !name.endsWith(".md")) continue;
    const rel = `memory/${name}`;
    const buf = await store.read(rel);
    if (!buf) continue;
    let frontmatter: Record<string, unknown>;
    let body: string;
    try {
      ({ frontmatter, body } = parseFrontmatter(buf.toString("utf8")));
    } catch (err) {
      // Notes emitted before the yamlScalar fix can carry an unquoted colon in
      // `description:` and fail YAML parsing. That is a FINDING, not a skip — a
      // silently skipped note would read as "no pattern notes" (the false-clean
      // class this package keeps meeting).
      out.push({
        notePath: rel,
        kind: "unknown",
        pattern: `(unparseable: ${(err as Error).message.slice(0, 80)})`,
        acceptedAt: "",
        after_k: 0,
        after_n: 0,
        occurrences: 0,
        verdict: "UNPARSEABLE_NOTE",
        streak: 1,
      });
      continue;
    }

    const mPattern = body.match(/^\*\*Pattern:\*\*\s*(.+)$/m);
    if (!mPattern) continue; // not a machine-scored note; nothing honest to measure
    const pattern = mPattern[1]?.trim() ?? "";
    const mTitle = String(frontmatter.title ?? "");
    const kind =
      mTitle
        .replace(/^Recurring\s+/i, "")
        .trim()
        .replace(/\s+/g, "_") || "unknown";
    const mPrev = body.match(/^\*\*Prevalence:\*\*\s*(\d+)\/(\d+)\s+sessions/m);

    const accepted =
      (await acceptedAtFor(store, rel)) ??
      (typeof frontmatter.createdAt === "string" ? frontmatter.createdAt : null);
    if (!accepted) continue; // undatable note: a verdict without a start line is fiction
    const acceptedTs = Date.parse(accepted);
    if (Number.isNaN(acceptedTs)) continue;

    const after = digests.filter((d) => d.sessionTs > acceptedTs);
    const channels = KIND_TO_CHANNELS[kind] ?? ["toolErrors", "hookBlocks", "userCorrections"];
    let occurrences = 0;
    const sessions = new Set<string>();
    const modelAfter: Record<string, number> = {};
    const modelHits: Record<string, Set<string>> = {};
    for (const d of after) {
      const models = d.models?.length ? d.models : ["unknown"];
      for (const m of models) modelAfter[m] = (modelAfter[m] ?? 0) + 1;
      let hit = false;
      for (const ch of channels) {
        const arr = d[ch] as Array<{ snip: string }> | undefined;
        if (!Array.isArray(arr)) continue;
        for (const e of arr) {
          if (signalKey(e.snip) === pattern) {
            occurrences += 1;
            hit = true;
          }
        }
      }
      if (hit) {
        sessions.add(d.id);
        for (const m of models) (modelHits[m] ??= new Set()).add(d.id);
      }
    }

    const after_k = sessions.size;
    const after_n = after.length;
    const verdict: EfficacyVerdict =
      after_n < MIN_AFTER_SESSIONS
        ? "INSUFFICIENT_DATA"
        : after_k === 0
          ? "RESOLVED"
          : "PERSISTING";

    // Model-conditional verdicts: RESOLVED-on-X / PERSISTING-on-Y is a
    // scope-narrowing finding, not a contradiction (GEPA Pareto rule) — keep
    // both variants when each wins somewhere.
    let model_verdicts: Record<string, string> | undefined;
    if (verdict === "RESOLVED" || verdict === "PERSISTING") {
      model_verdicts = {};
      for (const [m, n] of Object.entries(modelAfter)) {
        if (n < MIN_MODEL_SESSIONS) continue; // thin windows never judge
        const k = modelHits[m]?.size ?? 0;
        model_verdicts[m] = `${k ? "PERSISTING" : "RESOLVED"} ${k}/${n}`;
      }
      if (Object.keys(model_verdicts).length === 0) model_verdicts = undefined;
    }

    out.push({
      notePath: rel,
      kind,
      pattern,
      acceptedAt: accepted,
      then_k: mPrev ? Number(mPrev[1]) : undefined,
      then_n: mPrev ? Number(mPrev[2]) : undefined,
      after_k,
      after_n,
      occurrences,
      verdict,
      streak: 1,
      model_verdicts,
    });
  }

  // Streaks: a verdict is a data point; two agreeing runs are a trend the
  // lifecycle may act on. History lives in operational storage — canonical
  // memory (memoryTreeHash) is never touched by scoring.
  const streaks = await loadStreaks(store);
  for (const r of out) {
    const prev = streaks[r.notePath];
    r.streak = prev && prev[0] === r.verdict ? prev[1] + 1 : 1;
    if (r.verdict === "PERSISTING" && r.streak >= 2) r.recommend_mechanize = true;
  }
  await appendHistory(store, out);

  if (opts.proposeExpiry) {
    for (const r of out) {
      if (r.verdict === "RESOLVED" && r.streak >= 2 && r.after_n >= MIN_EXPIRY_WINDOW) {
        await proposeExpiryFor(store, r);
      }
    }
  }

  // worst news first: persisting patterns are the actionable ones
  const rank = { UNPARSEABLE_NOTE: 0, PERSISTING: 1, INSUFFICIENT_DATA: 2, RESOLVED: 3 };
  out.sort((a, b) => rank[a.verdict] - rank[b.verdict] || b.after_k - a.after_k);
  return out;
}
