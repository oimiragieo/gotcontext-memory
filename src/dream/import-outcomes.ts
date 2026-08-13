import type { MemoryStore } from "../store.js";
import { claimKey } from "./run.js";

/**
 * Import-outcome ledger — efficacy must score only notes whose landing into
 * canonical memory actually succeeded. Without this, a note that was proposed,
 * REFUSED (CAS conflict, secret hit, index cap, path violation…) or explicitly
 * rejected by a human could still get counted as if it had taken effect, simply
 * because some OTHER version of the same path happened to be on disk.
 *
 * Keyed by claimKey(targetPath, body) — the same content-addressed identity dream
 * suppression already uses — NOT by targetPath alone. A path can go through many
 * outcomes over its life (an update refused today does not retroactively
 * invalidate content that landed yesterday); keying on the exact body means a
 * refusal only ever shadows the specific text it refused, never a different,
 * still-live version of the same note.
 */

export type ImportOutcome = "landed" | "refused" | "skipped";

const LEDGER_PATH = "efficacy/import-outcomes.jsonl";

export async function recordImportOutcome(
  store: MemoryStore,
  opts: { targetPath: string; body: string; outcome: ImportOutcome; reason?: string },
): Promise<void> {
  const buf = await store.read(LEDGER_PATH);
  const prior = buf ? buf.toString("utf8") : "";
  const line = `${JSON.stringify({
    claim: claimKey(opts.targetPath, opts.body),
    targetPath: opts.targetPath,
    outcome: opts.outcome,
    reason: opts.reason,
    at: new Date().toISOString(),
  })}\n`;
  await store.commitOperational({
    relativePath: LEDGER_PATH,
    body: prior + line,
    scanSecrets: false,
  });
}

/** claim -> most recent recorded outcome. Absence means "no record" (legacy: score it). */
export async function loadImportOutcomes(store: MemoryStore): Promise<Map<string, ImportOutcome>> {
  const out = new Map<string, ImportOutcome>();
  const buf = await store.read(LEDGER_PATH);
  if (!buf) return out;
  for (const line of buf.toString("utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line) as { claim?: string; outcome?: ImportOutcome };
      if (rec.claim && rec.outcome) out.set(rec.claim, rec.outcome);
    } catch {
      // one corrupt ledger line only loses that line's contribution
    }
  }
  return out;
}
