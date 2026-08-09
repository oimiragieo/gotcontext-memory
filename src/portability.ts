import { createWriteStream } from "node:fs";
import type { Dirent } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip, gunzipSync } from "node:zlib";
import { regenerateIndex } from "./index.js";
import { assertSafeRelativePath } from "./paths.js";
import type { MemoryStore } from "./store.js";

export async function exportStore(store: MemoryStore, destArchive: string): Promise<void> {
  if (!path.isAbsolute(destArchive)) {
    throw new Error("export destination must be an absolute path outside the store");
  }
  const storeRoot = path.resolve(store.root);
  if (destArchive === storeRoot || destArchive.startsWith(storeRoot + path.sep)) {
    throw new Error("export archive must not target the store root");
  }

  const files: Array<{ path: string; contentBase64: string }> = [];
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
      else if (e.isFile()) {
        const buf = await readFile(abs);
        files.push({ path: rel, contentBase64: buf.toString("base64") });
      }
    }
  };
  await walk(path.join(store.root, "memory"), "memory");
  await walk(path.join(store.root, "revisions"), "revisions");
  await walk(path.join(store.root, "proposals"), "proposals");
  for (const rel of ["MEMORY.md", "config.json"]) {
    const buf = await store.read(rel);
    if (buf) files.push({ path: rel, contentBase64: buf.toString("base64") });
  }

  await mkdir(path.dirname(destArchive), { recursive: true });
  const payload = `${files.map((f) => JSON.stringify(f)).join("\n")}\n`;
  await pipeline(Readable.from([payload]), createGzip(), createWriteStream(destArchive));
}

export async function importStore(
  store: MemoryStore,
  archivePath: string,
  mode: "merge" | "replace",
): Promise<{ imported: number; rejected: number; skipped: number }> {
  if (!path.isAbsolute(archivePath)) {
    throw new Error("import archive must be absolute");
  }
  if (mode !== "merge" && mode !== "replace") {
    throw new Error("import requires --merge or --replace");
  }
  const raw = gunzipSync(await readFile(archivePath)).toString("utf8");
  let imported = 0;
  let rejected = 0;
  let skipped = 0;
  const archivePaths = new Set<string>();
  const rows: Array<{ path: string; contentBase64: string }> = [];
  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    const row = JSON.parse(line) as { path: string; contentBase64: string };
    rows.push(row);
    archivePaths.add(row.path.replace(/\\/g, "/"));
  }

  if (mode === "replace") {
    // Remove canonical memory files absent from the archive (real replace semantics).
    const memDir = path.join(store.root, "memory");
    const walkDel = async (dir: string, prefix: string) => {
      let ents: Dirent[];
      try {
        ents = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of ents) {
        const abs = path.join(dir, e.name);
        const rel = path.posix.join(prefix, e.name);
        if (e.isDirectory()) await walkDel(abs, rel);
        else if (e.isFile() && e.name.endsWith(".md") && !archivePaths.has(rel)) {
          const base = await store.currentHash(rel);
          try {
            await store.deleteCanonical({
              relativePath: rel,
              baseHash: base,
              provenance: { authored_by: "system", source: "import-replace" },
            });
          } catch {
            /* leave and count later via reject if needed */
          }
        }
      }
    };
    await walkDel(memDir, "memory");
  }

  for (const row of rows) {
    try {
      assertSafeRelativePath(row.path);
    } catch {
      rejected += 1;
      continue;
    }
    const bodyBuf = Buffer.from(row.contentBase64, "base64");
    if (row.path === "MEMORY.md" || row.path.startsWith("memory/")) {
      try {
        const body = bodyBuf.toString("utf8");
        const base = await store.currentHash(row.path);
        await store.commitCanonical({
          relativePath: row.path,
          body,
          baseHash: base,
          provenance: { authored_by: "system", source: "import" },
        });
        imported += 1;
      } catch {
        rejected += 1;
      }
      continue;
    }
    if (
      row.path === "config.json" ||
      row.path.startsWith("revisions/") ||
      row.path.startsWith("proposals/")
    ) {
      try {
        await store.commitOperational({
          relativePath: row.path,
          body: bodyBuf,
          scanSecrets: !!row.path.startsWith("proposals/"),
        });
        imported += 1;
      } catch {
        rejected += 1;
      }
      continue;
    }
    skipped += 1;
  }

  const index = await regenerateIndex(store);
  const indexHash = await store.currentHash("MEMORY.md");
  try {
    await store.commitCanonical({
      relativePath: "MEMORY.md",
      body: index,
      baseHash: indexHash,
      provenance: { authored_by: "system", source: "import-index" },
    });
  } catch {
    /* ok if unchanged / conflict */
  }

  await store.commitOperational({
    relativePath: `receipts/import-${Date.now()}.json`,
    body: `${JSON.stringify({
      mode,
      imported,
      rejected,
      skipped,
      at: new Date().toISOString(),
    })}\n`,
    scanSecrets: false,
  });
  return { imported, rejected, skipped };
}
