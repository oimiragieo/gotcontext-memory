import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { adapters, MARK_BEGIN, MARK_END } from "./adapters/types.js";
import { loadConfig } from "./config.js";
import { memoryPolicyFragmentLines } from "./dream/policy.js";
import { fileExists, sha256Hex } from "./hash.js";

export type ManifestEntry = {
  adapter: string;
  path: string;
  /** sha256 of full file before managed upsert, or null if created */
  preImageHash: string | null;
  /** Full file bytes before upsert (base64), for byte-faithful uninstall */
  preImageBase64: string | null;
  blockHash: string;
};

export async function installFragments(opts: {
  dryRun?: boolean;
  cwd?: string;
  home?: string;
  storeHint: string;
  storeRoot?: string;
  force?: boolean;
}): Promise<{ planned: string[]; manifest: ManifestEntry[] }> {
  const cwd = opts.cwd ?? process.cwd();
  const home = opts.home ?? os.homedir();
  const planned: string[] = [];
  const manifest: ManifestEntry[] = [];
  const writtenThisRun = new Map<string, string>(); // absPath -> blockHash

  let policyLines: string[] = [];
  if (opts.storeRoot && (await fileExists(path.join(opts.storeRoot, "config.json")))) {
    const cfg = await loadConfig(opts.storeRoot);
    policyLines = memoryPolicyFragmentLines(cfg.memory.policy);
  }

  const norm = (s: string) => s.replace(/\r\n/g, "\n");

  for (const a of adapters) {
    if (!(await a.detect())) continue;
    const target = a.fragmentPath(home, cwd);
    const absTarget = path.resolve(target);
    // Installer must never write under a gotcontext store root
    if (opts.storeRoot) {
      const root = path.resolve(opts.storeRoot);
      if (absTarget === root || absTarget.startsWith(root + path.sep)) {
        throw new Error(`Installer refuses store-root target: ${target}`);
      }
    }
    planned.push(`${a.id}:${target}`);
    let fragment = a.render(opts.storeHint);
    if (policyLines.length) {
      fragment = fragment.replace(
        MARK_END,
        `${policyLines.join("\n")}\n${MARK_END}`,
      );
    }
    const blockHash = sha256Hex(norm(fragment));

    // Multiple adapters may share one path (agy + opencode → AGENTS.md)
    if (writtenThisRun.has(absTarget)) {
      if (writtenThisRun.get(absTarget) === blockHash) {
        manifest.push({
          adapter: a.id,
          path: target,
          preImageHash: null,
          preImageBase64: null,
          blockHash,
        });
        continue;
      }
      throw new Error(`Conflicting managed fragments for ${target}`);
    }

    let existing = "";
    if (await fileExists(target)) existing = await readFile(target, "utf8");
    const preImageHash = existing ? sha256Hex(existing) : null;
    const preImageBase64 = existing
      ? Buffer.from(existing, "utf8").toString("base64")
      : null;

    if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
      const start = existing.indexOf(MARK_BEGIN);
      const end = existing.indexOf(MARK_END) + MARK_END.length;
      const managed = existing.slice(start, end);
      if (norm(managed) !== norm(fragment) && !opts.force) {
        throw new Error(
          `Managed block tampered in ${target}; pass --force to overwrite`,
        );
      }
    }

    manifest.push({
      adapter: a.id,
      path: target,
      preImageHash,
      preImageBase64,
      blockHash,
    });
    writtenThisRun.set(absTarget, blockHash);
    if (opts.dryRun) continue;
    await mkdir(path.dirname(target), { recursive: true });
    const next = upsertManaged(existing, fragment);
    await writeFile(target, next, "utf8");
  }

  return { planned, manifest };
}

export async function uninstallFragments(opts: {
  store: import("./store.js").MemoryStore;
  force?: boolean;
}): Promise<string[]> {
  const store = opts.store;
  const manBuf = await store.read("installer-manifest.json");
  if (!manBuf) {
    throw new Error("No installer-manifest.json — nothing to uninstall");
  }
  const man = JSON.parse(manBuf.toString("utf8")) as {
    entries: ManifestEntry[];
  };
  const restored: string[] = [];
  for (const e of man.entries) {
    // Adapter paths are outside the store root — installer carve-out.
    const abs = path.resolve(e.path);
    const root = path.resolve(store.root);
    if (abs === root || abs.startsWith(root + path.sep)) {
      throw new Error(`Uninstall refuses store-root path in manifest: ${e.path}`);
    }
    if (e.preImageBase64 != null) {
      await writeFile(
        e.path,
        Buffer.from(e.preImageBase64, "base64").toString("utf8"),
        "utf8",
      );
    } else if (await fileExists(e.path)) {
      const existing = await readFile(e.path, "utf8");
      if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
        const start = existing.indexOf(MARK_BEGIN);
        const end = existing.indexOf(MARK_END) + MARK_END.length;
        const without =
          (existing.slice(0, start) + existing.slice(end)).trimEnd() + "\n";
        await writeFile(e.path, without === "\n" ? "" : without, "utf8");
      }
    }
    restored.push(e.path);
  }
  // Store-root mutation must go through MemoryStore (sole writer).
  await store.commitOperational({
    relativePath: "installer-manifest.json",
    body:
      JSON.stringify({
        entries: [],
        uninstalledAt: new Date().toISOString(),
      }) + "\n",
    scanSecrets: false,
  });
  return restored;
}

function upsertManaged(existing: string, fragment: string): string {
  if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
    const start = existing.indexOf(MARK_BEGIN);
    const end = existing.indexOf(MARK_END) + MARK_END.length;
    return existing.slice(0, start) + fragment + existing.slice(end);
  }
  if (!existing.trim()) return fragment + "\n";
  return existing.replace(/\s*$/, "\n\n") + fragment + "\n";
}
