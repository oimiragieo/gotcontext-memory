import os from "node:os";
import path from "node:path";

export type CorpusSourceName = "claude" | "codex" | "cursor" | "agy" | "opencode";

/**
 * Default on-disk roots per harness for `dream --source …`.
 * Dogfood seeds package fixtures into these paths (see docker/verify.sh).
 *
 * Live layouts may drift; fixtures under test/fixtures remain the parse contract.
 */
export function defaultCorpusRoots(
  source: CorpusSourceName,
  opts: { home?: string; cwd?: string } = {},
): string[] {
  const home = opts.home ?? os.homedir();
  const cwd = opts.cwd ?? process.cwd();
  switch (source) {
    case "claude":
      return [path.join(home, ".claude", "projects")];
    case "codex":
      // Prefer sessions/; also accept projects/ (dogfood + some layouts).
      return [path.join(home, ".codex", "sessions"), path.join(home, ".codex", "projects")];
    case "cursor":
      return [path.join(home, ".cursor", "projects"), path.join(cwd, ".cursor")];
    case "agy":
      return [path.join(home, ".agy", "sessions"), path.join(home, ".antigravitycli")];
    case "opencode":
      return [path.join(home, ".opencode", "sessions"), path.join(home, ".opencode", "projects")];
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}
