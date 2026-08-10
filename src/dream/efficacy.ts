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
};

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

export async function measureEfficacy(
  store: MemoryStore,
  digests: SessionDigest[],
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
    for (const d of after) {
      for (const ch of channels) {
        const arr = d[ch] as Array<{ snip: string }> | undefined;
        if (!Array.isArray(arr)) continue;
        for (const e of arr) {
          if (signalKey(e.snip) === pattern) {
            occurrences += 1;
            sessions.add(d.id);
          }
        }
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
    });
  }
  // worst news first: persisting patterns are the actionable ones
  const rank = { UNPARSEABLE_NOTE: 0, PERSISTING: 1, INSUFFICIENT_DATA: 2, RESOLVED: 3 };
  out.sort((a, b) => rank[a.verdict] - rank[b.verdict] || b.after_k - a.after_k);
  return out;
}
