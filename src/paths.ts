import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export type StoreTier = "user" | "project";

export function expandHome(p: string): string {
  if (p === "~") return os.homedir();
  if (p.startsWith(`~${path.sep}`) || p.startsWith("~/")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

export function userStoreRoot(home = os.homedir()): string {
  return path.join(home, ".gotcontext");
}

export function projectStoreRoot(cwd = process.cwd()): string {
  return path.join(cwd, ".gotcontext");
}

export function resolveStoreRoot(opts: {
  tier?: StoreTier;
  cwd?: string;
  home?: string;
  projectExists: boolean;
}): string {
  const home = opts.home ?? os.homedir();
  const cwd = opts.cwd ?? process.cwd();
  if (opts.tier === "user") return userStoreRoot(home);
  if (opts.tier === "project") {
    if (!opts.projectExists) {
      throw new Error(
        "Project store not present. Valid options: --store user (create project store with init --project).",
      );
    }
    return projectStoreRoot(cwd);
  }
  if (opts.projectExists) {
    throw new Error(
      "Ambiguous store. Both project and user stores may apply. Valid options: --store user | --store project.",
    );
  }
  return userStoreRoot(home);
}

export function assertSafeRelativePath(rel: string): string {
  const normalized = rel.replace(/\\/g, "/");
  if (
    path.isAbsolute(rel) ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.startsWith("\\\\") ||
    normalized.includes("..") ||
    normalized.startsWith("~")
  ) {
    throw new Error(`Path containment violation: ${rel}`);
  }
  return normalized;
}

/** Resolve path under store; reject escapes and symlink/junction ancestors. */
export async function resolveUnderStore(
  storeRoot: string,
  rel: string,
): Promise<string> {
  const safe = assertSafeRelativePath(rel);
  const rootReal = await realpath(storeRoot).catch(async () => {
    // store may be mid-init
    return path.resolve(storeRoot);
  });
  const abs = path.resolve(rootReal, safe);
  if (abs !== rootReal && !abs.startsWith(rootReal + path.sep)) {
    throw new Error(`Path escapes store root: ${rel}`);
  }
  // Walk ancestors; if any existing component is a symlink outside root, reject
  let cur = abs;
  while (cur.startsWith(rootReal)) {
    try {
      const st = await lstat(cur);
      if (st.isSymbolicLink()) {
        const target = await realpath(cur);
        if (target !== rootReal && !target.startsWith(rootReal + path.sep)) {
          throw new Error(`Symlink escape: ${rel}`);
        }
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        cur = path.dirname(cur);
        continue;
      }
      if ((err as Error).message?.includes("Symlink")) throw err;
    }
    if (cur === rootReal) break;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return abs;
}

/** Sync lexical-only resolve for lock stub paths before file exists — still checks text. */
export function resolveUnderStoreSync(storeRoot: string, rel: string): string {
  const safe = assertSafeRelativePath(rel);
  const root = path.resolve(storeRoot);
  const abs = path.resolve(root, safe);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error(`Path escapes store root: ${rel}`);
  }
  return abs;
}
