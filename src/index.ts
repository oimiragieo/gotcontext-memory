import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import type { MemoryStore } from "./store.js";

export type IndexOverlay = {
  upserts?: Record<string, string>;
  deletes?: string[];
};

/** Pure: returns MEMORY.md bytes for the post-overlay store view. No FS writes. */
export async function regenerateIndex(
  store: MemoryStore,
  overlay: IndexOverlay = {},
  opts: { nowMs?: number } = {},
): Promise<string> {
  const now = opts.nowMs ?? Date.now();
  const files = new Map<string, string>();
  const memoryDir = path.join(store.root, "memory");
  try {
    await walk(memoryDir, store.root, files);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  for (const [rel, body] of Object.entries(overlay.upserts ?? {})) {
    files.set(rel.replace(/\\/g, "/"), body);
  }
  for (const del of overlay.deletes ?? []) {
    files.delete(del.replace(/\\/g, "/"));
  }

  const lines = ["# Memory index", ""];
  const sorted = [...files.keys()].sort();
  for (const rel of sorted) {
    if (!rel.startsWith("memory/") || !rel.endsWith(".md")) continue;
    const raw = files.get(rel)!;
    const { frontmatter, body } = parseFrontmatter(raw);
    if (typeof frontmatter.expires === "string") {
      const exp = Date.parse(frontmatter.expires);
      if (!Number.isNaN(exp) && exp <= now) continue;
    }
    const title =
      (typeof frontmatter.title === "string" && frontmatter.title) ||
      path.basename(rel, ".md");
    const hook =
      (typeof frontmatter.description === "string" &&
        frontmatter.description) ||
      firstLine(body);
    lines.push(`- [${title}](${rel}) — ${hook}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function walk(
  dir: string,
  root: string,
  out: Map<string, string>,
): Promise<void> {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const abs = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walk(abs, root, out);
      continue;
    }
    if (!item.isFile() || !item.name.endsWith(".md")) continue;
    const rel = path.relative(root, abs).split(path.sep).join("/");
    out.set(rel, await readFile(abs, "utf8"));
  }
}

function firstLine(body: string): string {
  const line = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return line ? line.slice(0, 80) : "";
}
