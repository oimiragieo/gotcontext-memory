import type { CorpusSource, ScanOpts, ScanResult, Transcript } from "./types.js";

/** Codex session format (fixture-pinned): JSONL with {type,role,text,ts} */
export const codexCorpus: CorpusSource = {
  name: "codex",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const { readdir, readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      const files: string[] = [];
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else if (e.name.endsWith(".jsonl")) files.push(abs);
          }
        };
        await walk(root);
      } catch (err) {
        errors.push({ path: root, message: (err as Error).message });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (opts.scope === "project" && opts.projectKey && projectKey !== opts.projectKey) {
          excluded += 1;
          continue;
        }
        try {
          const raw = await readFile(file, "utf8");
          const turns = [];
          for (const line of raw.split(/\r?\n/).filter(Boolean)) {
            const obj = JSON.parse(line) as Record<string, unknown>;
            // Codex fixture shape
            if (obj.role || obj.text) {
              turns.push({
                role: String(obj.role ?? "user"),
                text: String(obj.text ?? ""),
                ts: String(obj.ts ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
              continue;
            }
            // Also accept Claude-shaped for migration fixtures
            const message = obj.message as Record<string, unknown> | undefined;
            if (message) {
              turns.push({
                role: String(message.role ?? "user"),
                text:
                  typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content ?? ""),
                ts: String(obj.timestamp ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            }
          }
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "codex",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }
    return {
      transcripts,
      scanned,
      included: transcripts.length,
      excluded_permission: excluded,
      malformed,
      errors,
      label: scanned === 0 ? "EMPTY" : "OK",
    };
  },
};
