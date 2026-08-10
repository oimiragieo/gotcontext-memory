import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { CorpusSource, ScanOpts, ScanResult, Transcript, TranscriptTurn } from "./types.js";
import { corpusScanLabel } from "./types.js";

/** Fixture-pinned Claude Code JSONL: one JSON object per line with type/message fields. */
export const claudeCorpus: CorpusSource = {
  name: "claude",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;
    let unreadable = 0;

    for (const root of opts.roots) {
      let files: string[] = [];
      try {
        files = await listJsonl(root);
      } catch (err) {
        errors.push({
          path: root,
          message: (err as Error).message,
        });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (opts.scope === "project" && opts.projectKey && projectKey !== opts.projectKey) {
          excluded += 1;
          continue;
        }
        let raw: string;
        try {
          // NOTE: whole-file read. On a real corpus this throws on any transcript
          // over the V8 string ceiling ("File size (N) is greater than 2 GiB").
          // The streaming digest path (src/dream/digest.ts) is what `dream` uses;
          // this importer is retained for the fixture-pinned scan API.
          raw = await readFile(file, "utf8");
        } catch (err) {
          unreadable += 1;
          errors.push({ path: file, message: `unreadable: ${(err as Error).message}` });
          continue;
        }
        try {
          const turns = parseClaudeJsonl(raw, path.basename(file));
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "claude",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: `malformed: ${(err as Error).message}` });
        }
      }
    }

    const included = transcripts.length;
    const label = corpusScanLabel(scanned, included);
    return {
      transcripts,
      scanned,
      included,
      excluded_permission: excluded,
      malformed,
      unreadable,
      errors,
      label,
    };
  },
};

async function listJsonl(root: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    const ents = await readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) await walk(abs);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(abs);
    }
  };
  await walk(root);
  return out;
}

function parseClaudeJsonl(raw: string, transcriptId: string): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line) as Record<string, unknown>;
    const message = obj.message as Record<string, unknown> | undefined;
    if (!message) continue;
    const role = String(message.role ?? obj.type ?? "unknown");
    let text = "";
    const content = message.content;
    const tool_events: TranscriptTurn["tool_events"] = [];
    const skill_invocations: TranscriptTurn["skill_invocations"] = [];
    if (typeof content === "string") text = content;
    else if (Array.isArray(content)) {
      for (const part of content) {
        const p = part as Record<string, unknown>;
        if (p.type === "text") text += String(p.text ?? "");
        if (p.type === "tool_use") {
          const name = String(p.name ?? "");
          tool_events.push({
            name,
            transcript_id: transcriptId,
            isError: false,
          });
          if (name === "Skill" || name.toLowerCase() === "skill") {
            const input = (p.input ?? {}) as Record<string, unknown>;
            skill_invocations.push({
              skill: String(input.skill ?? input.name ?? "unknown"),
              ts: String(obj.timestamp ?? ""),
              transcript_id: transcriptId,
            });
          }
        }
      }
    }
    turns.push({
      role,
      text,
      ts: String(obj.timestamp ?? ""),
      tool_events,
      skill_invocations,
    });
  }
  return turns;
}
