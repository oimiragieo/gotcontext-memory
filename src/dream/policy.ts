export type DreamPolicy = {
  focus?: string[];
  excludeSources?: string[];
  maxProposals?: number;
};

type Textish = { source: string; turns?: Array<{ text?: string }> };

/**
 * Filter transcripts by source exclusion and optional focus keywords.
 * maxProposals is applied to proposals in runDream, not here.
 */
export function applyDreamPolicy<T extends Textish>(
  items: T[],
  policy: DreamPolicy,
): { kept: T[]; dropped: number } {
  let kept = items;
  if (policy.excludeSources?.length) {
    const ban = new Set(policy.excludeSources);
    kept = kept.filter((t) => !ban.has(t.source));
  }
  if (policy.focus?.length) {
    const needles = policy.focus.map((f) => f.toLowerCase());
    kept = kept.filter((t) => {
      const blob = (t.turns ?? [])
        .map((turn) => String(turn.text ?? "").toLowerCase())
        .join("\n");
      return needles.some((n) => blob.includes(n));
    });
  }
  return { kept, dropped: items.length - kept.length };
}

export function memoryPolicyFragmentLines(
  memoryPolicy: Record<string, unknown>,
): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(memoryPolicy)) {
    lines.push(`- memory.policy.${k}: ${JSON.stringify(v)}`);
  }
  return lines;
}
