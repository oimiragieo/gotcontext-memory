import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export function sha256Hex(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Canonical memory files under memory/ plus MEMORY.md — excludes operational paths. */
export async function memoryTreeHash(storeRoot: string): Promise<string> {
  const entries: Array<[string, string]> = [];
  const memoryDir = path.join(storeRoot, "memory");
  try {
    await walkMemoryFiles(memoryDir, storeRoot, entries);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  const indexPath = path.join(storeRoot, "MEMORY.md");
  try {
    const buf = await readFile(indexPath);
    entries.push(["MEMORY.md", sha256Hex(buf)]);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const payload = entries.map(([rel, h]) => `${rel}:${h}`).join("\n");
  return sha256Hex(payload);
}

async function walkMemoryFiles(
  dir: string,
  storeRoot: string,
  out: Array<[string, string]>,
): Promise<void> {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const abs = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walkMemoryFiles(abs, storeRoot, out);
      continue;
    }
    if (!item.isFile() || !item.name.endsWith(".md")) continue;
    const rel = path.relative(storeRoot, abs).split(path.sep).join("/");
    out.push([rel, sha256Hex(await readFile(abs))]);
  }
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
