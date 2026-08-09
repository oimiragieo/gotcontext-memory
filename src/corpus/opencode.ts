import type { CorpusSource, ScanResult } from "./types.js";

export const opencodeCorpus: CorpusSource = {
  name: "opencode",
  async scan(opts): Promise<ScanResult> {
    const { readdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const candidates: string[] = [];
    for (const root of opts.roots) {
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else candidates.push(abs);
          }
        };
        await walk(root);
      } catch {
        /* */
      }
    }
    return {
      transcripts: [],
      scanned: candidates.length,
      included: 0,
      excluded_permission: 0,
      malformed: 0,
      errors: candidates.map((p) => ({
        path: p,
        message: "PARTIAL — enumerated only; no dogfood receipts",
      })),
      label: "PARTIAL — no dogfood receipts",
    };
  },
};
