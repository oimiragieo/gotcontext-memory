import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import { defaultConfigJson, loadConfig } from "./config.js";
import { fileExists, memoryTreeHash, sha256Hex } from "./hash.js";
import { assertSafeRelativePath, resolveUnderStore, resolveUnderStoreSync } from "./paths.js";
import { SecretDetected, scan } from "./secrets.js";

export class CasConflict extends Error {
  currentHash: string;
  constructor(currentHash: string) {
    super(`CasConflict: expected baseHash mismatch; current=${currentHash}`);
    this.name = "CasConflict";
    this.currentHash = currentHash;
  }
}

export class IndexCapExceeded extends Error {
  constructor(
    public lines: number,
    public bytes: number,
    public lineCap: number,
    public byteCap: number,
  ) {
    super(`IndexCapExceeded: lines=${lines}/${lineCap} bytes=${bytes}/${byteCap}`);
    this.name = "IndexCapExceeded";
  }
}

export type CommitProvenance = {
  authored_by: "dream" | "agent" | "human" | "system";
  source?: string;
  transcript_id?: string | null;
  proposal_id?: string;
};

export const LINE_CAP = 200;
export const BYTE_CAP = 25 * 1024;
export const BASE_ABSENT = "absent";

function assertCanonicalRel(rel: string): void {
  if (!(rel === "MEMORY.md" || rel.startsWith("memory/"))) {
    throw new Error(`Canonical path required, got ${rel}`);
  }
}

export function checkIndexCaps(body: string): void {
  const lines = body.split(/\r?\n/).length;
  const bytes = Buffer.byteLength(body, "utf8");
  if (lines > LINE_CAP || bytes > BYTE_CAP) {
    throw new IndexCapExceeded(lines, bytes, LINE_CAP, BYTE_CAP);
  }
}

export class MemoryStore {
  private allowlist: string[] = [];

  constructor(public readonly root: string) {}

  static async initStore(root: string): Promise<MemoryStore> {
    await mkdir(path.join(root, "memory"), { recursive: true });
    await mkdir(path.join(root, "proposals"), { recursive: true });
    await mkdir(path.join(root, "proposals", "accepted"), { recursive: true });
    await mkdir(path.join(root, "proposals", "rejected"), { recursive: true });
    await mkdir(path.join(root, "revisions"), { recursive: true });
    await mkdir(path.join(root, "receipts"), { recursive: true });
    await mkdir(path.join(root, "locks"), { recursive: true });
    const index = path.join(root, "MEMORY.md");
    if (!(await fileExists(index))) {
      await writeFile(index, "# Memory index\n\n", "utf8");
    }
    const cfgPath = path.join(root, "config.json");
    if (!(await fileExists(cfgPath))) {
      await writeFile(cfgPath, defaultConfigJson(), "utf8");
    }
    const store = new MemoryStore(root);
    await store.reloadConfig();
    return store;
  }

  async reloadConfig(): Promise<void> {
    const cfg = await loadConfig(this.root);
    this.allowlist = cfg.secrets.allowlist;
  }

  getSecretAllowlist(): string[] {
    return [...this.allowlist];
  }

  async memoryTreeHash(): Promise<string> {
    return memoryTreeHash(this.root);
  }

  async withCanonicalLocks<T>(
    relPaths: string[],
    fn: (locked: LockedStore) => Promise<T>,
  ): Promise<T> {
    const sorted = [...new Set(relPaths.map((p) => p.replace(/\\/g, "/")))].sort();
    const releases: Array<() => Promise<void>> = [];
    try {
      for (const rel of sorted) {
        // Containment before canonical predicate so traversal never reaches locks.
        assertSafeRelativePath(rel);
        if (!(rel === "MEMORY.md" || rel.startsWith("memory/"))) {
          throw new Error(`withCanonicalLocks only for canonical paths: ${rel}`);
        }
        const abs = await resolveUnderStore(this.root, rel);
        await mkdir(path.dirname(abs), { recursive: true });
        if (!(await fileExists(abs))) {
          const stub = path.join(this.root, "locks", `${sha256Hex(rel)}.lock`);
          await writeFile(stub, "", { flag: "a" });
          const release = await lockfile.lock(stub, {
            retries: { retries: 10, minTimeout: 20, maxTimeout: 200 },
            stale: 10_000,
          });
          releases.push(release);
        } else {
          const release = await lockfile.lock(abs, {
            retries: { retries: 10, minTimeout: 20, maxTimeout: 200 },
            stale: 10_000,
          });
          releases.push(release);
        }
      }
      return await fn(new LockedStore(this));
    } finally {
      for (const release of releases.reverse()) {
        try {
          await release();
        } catch {
          /* ignore */
        }
      }
    }
  }

  async commitCanonical(opts: {
    relativePath: string;
    body: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<{ hash: string }> {
    return this.withCanonicalLocks([opts.relativePath], (locked) =>
      locked.commitCanonicalLocked(opts),
    );
  }

  async commitOperational(opts: {
    relativePath: string;
    body: string | Buffer;
    scanSecrets?: boolean;
  }): Promise<void> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    if (rel === "MEMORY.md" || rel.startsWith("memory/")) {
      throw new Error("Use commitCanonical for canonical memory paths");
    }
    const text = typeof opts.body === "string" ? opts.body : opts.body.toString("utf8");
    if (opts.scanSecrets !== false) {
      const findings = scan(text, this.allowlist);
      if (findings.length) throw new SecretDetected(findings);
    }
    const abs = await resolveUnderStore(this.root, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
    const fh = await open(tmp, "w");
    try {
      await fh.writeFile(opts.body);
      await fh.close();
      await rename(tmp, abs);
    } catch (err) {
      try {
        await fh.close();
      } catch {
        /* */
      }
      await rm(tmp, { force: true });
      throw err;
    }
  }

  async deleteCanonical(opts: {
    relativePath: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<void> {
    await this.withCanonicalLocks([opts.relativePath], async (locked) => {
      await locked.deleteCanonicalLocked(opts);
    });
  }

  async removeOperational(relativePath: string): Promise<void> {
    const rel = relativePath.replace(/\\/g, "/");
    if (rel === "MEMORY.md" || rel.startsWith("memory/")) {
      throw new Error("Use deleteCanonical for canonical paths");
    }
    const abs = await resolveUnderStore(this.root, rel);
    await rm(abs, { force: true });
  }

  async read(relativePath: string): Promise<Buffer | null> {
    const abs = await resolveUnderStore(this.root, relativePath);
    try {
      return await readFile(abs);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async currentHash(relativePath: string): Promise<string> {
    const buf = await this.read(relativePath);
    return buf ? sha256Hex(buf) : BASE_ABSENT;
  }

  async history(
    relativePath: string,
  ): Promise<Array<{ hash: string; path: string; meta?: Record<string, unknown> }>> {
    const revDir = path.join(this.root, "revisions");
    const prefix = `${relativePath.replace(/\//g, "__")}.`;
    const { readdir } = await import("node:fs/promises");
    let names: string[] = [];
    try {
      names = await readdir(revDir);
    } catch {
      return [];
    }
    const out = [];
    for (const name of names) {
      if (!name.startsWith(prefix) || !name.endsWith(".md")) continue;
      const hashPart = name.slice(prefix.length, -3);
      const metaPath = path.join(revDir, name.replace(/\.md$/, ".meta.json"));
      let meta: Record<string, unknown> | undefined;
      try {
        meta = JSON.parse(await readFile(metaPath, "utf8"));
      } catch {
        /* */
      }
      out.push({
        hash: hashPart,
        path: path.join(revDir, name),
        meta,
      });
    }
    return out;
  }

  async rollback(
    relativePath: string,
    revisionHashPrefix: string,
    provenance: CommitProvenance,
  ): Promise<void> {
    const hist = await this.history(relativePath);
    const hit = hist.find((h) => h.hash.startsWith(revisionHashPrefix));
    if (!hit) throw new Error(`revision not found: ${revisionHashPrefix}`);
    const body = await readFile(hit.path, "utf8");
    const base = await this.currentHash(relativePath);
    await this.commitCanonical({
      relativePath,
      body,
      baseHash: base,
      provenance: { ...provenance, source: `rollback:${revisionHashPrefix}` },
    });
  }
}

export class LockedStore {
  constructor(private readonly store: MemoryStore) {}

  async commitCanonicalLocked(opts: {
    relativePath: string;
    body: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<{ hash: string }> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    assertCanonicalRel(rel);
    const findings = scan(opts.body, this.store.getSecretAllowlist());
    if (findings.length) throw new SecretDetected(findings);
    if (rel === "MEMORY.md") checkIndexCaps(opts.body);

    const abs = await resolveUnderStore(this.store.root, rel);
    const existing = await this.store.read(rel);
    const currentHash = existing ? sha256Hex(existing) : BASE_ABSENT;
    if (currentHash !== opts.baseHash) {
      throw new CasConflict(currentHash);
    }

    if (existing) {
      const revDir = path.join(this.store.root, "revisions");
      await mkdir(revDir, { recursive: true });
      const stem = `${rel.replace(/\//g, "__")}.${currentHash.slice(0, 12)}`;
      await writeFile(path.join(revDir, `${stem}.md`), existing);
      await writeFile(
        path.join(revDir, `${stem}.meta.json`),
        `${JSON.stringify(
          {
            path: rel,
            hash: currentHash,
            at: new Date().toISOString(),
            provenance: opts.provenance,
            allowlist: this.store.getSecretAllowlist(),
          },
          null,
          2,
        )}\n`,
      );
    }

    await mkdir(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
    const fh = await open(tmp, "w");
    try {
      await fh.writeFile(opts.body, "utf8");
      await fh.close();
      await rename(tmp, abs);
    } catch (err) {
      try {
        await fh.close();
      } catch {
        /* */
      }
      await rm(tmp, { force: true });
      throw err;
    }

    const hash = sha256Hex(opts.body);
    await appendJournal(this.store.root, {
      op: "commitCanonical",
      path: rel,
      baseHash: opts.baseHash,
      hash,
      at: new Date().toISOString(),
      provenance: opts.provenance,
      allowlist: this.store.getSecretAllowlist(),
    });
    return { hash };
  }

  async deleteCanonicalLocked(opts: {
    relativePath: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<void> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    assertCanonicalRel(rel);
    const existing = await this.store.read(rel);
    const currentHash = existing ? sha256Hex(existing) : BASE_ABSENT;
    if (currentHash !== opts.baseHash) throw new CasConflict(currentHash);
    if (!existing) return;
    const revDir = path.join(this.store.root, "revisions");
    await mkdir(revDir, { recursive: true });
    const stem = `${rel.replace(/\//g, "__")}.${currentHash.slice(0, 12)}`;
    await writeFile(path.join(revDir, `${stem}.md`), existing);
    await writeFile(
      path.join(revDir, `${stem}.meta.json`),
      `${JSON.stringify(
        {
          path: rel,
          hash: currentHash,
          at: new Date().toISOString(),
          provenance: opts.provenance,
          deleted: true,
        },
        null,
        2,
      )}\n`,
    );
    const abs = await resolveUnderStore(this.store.root, rel);
    await rm(abs, { force: true });
    await appendJournal(this.store.root, {
      op: "deleteCanonical",
      path: rel,
      baseHash: opts.baseHash,
      hash: BASE_ABSENT,
      at: new Date().toISOString(),
      provenance: opts.provenance,
    });
  }
}

async function appendJournal(root: string, entry: Record<string, unknown>): Promise<void> {
  const journal = path.join(root, "commits.jsonl");
  await writeFile(journal, `${JSON.stringify(entry)}\n`, { flag: "a" });
}

// silence unused sync helper warning if tree-shaken — used by tests optionally
void resolveUnderStoreSync;
