import type { CorpusSource, ScanResult } from "./types.js";

export const agyCorpus: CorpusSource = {
  name: "agy",
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
        // LEGITIMATE SWALLOW (optional root): a harness that is not installed has no
        // corpus directory; absence is enumerated as zero, not as an error.
        /* */
      }
    }
    return {
      transcripts: [],
      scanned: candidates.length,
      included: 0,
      excluded_permission: 0,
      malformed: 0,
      errors: candidates.map((path) => ({
        path,
        message: "PARTIAL — enumerated only; no dogfood receipts",
      })),
      label: "PARTIAL — no dogfood receipts",
    };
  },
};
