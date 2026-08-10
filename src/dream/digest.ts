import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";

/**
 * Session digests: the bounded, streamed substrate the dreamer reasons over.
 *
 * Why this layer exists. Reading whole transcripts into memory does not survive a
 * real workstation: the machine this design came from carries 11,683 transcripts /
 * 9.6 GB, with a single 2.3 GB file that exceeds V8's maximum string length outright.
 * Every transcript is therefore STREAMED line by line and reduced to a ~1 KB digest,
 * and only digests are held in memory.
 *
 * It also makes cross-session PREVALENCE expressible. A pattern is only worth
 * remembering when it recurs, and recurrence cannot be observed from one transcript
 * at a time.
 */

/** Bounds the SIZE of the sampled arrays. It must never bound the COUNTS. */
export const DIGEST_SIGNAL_CAP = 60;
/** Per-file read ceiling; hitting it is TRUNCATION, never corruption. */
export const DIGEST_MAX_BYTES = 32 * 1024 * 1024;

export type DigestSignal = { line: number; snip: string };
export type DigestPreference = { line: number; span: string };

export type SessionDigest = {
  id: string;
  source: string;
  path: string;
  projectKey?: string;
  /** Session clock, taken from turn timestamps — NOT the file's mtime. */
  sessionTs: number;
  bytes: number;
  truncated: boolean;
  malformed: number;
  nUser: number;
  nAssistant: number;
  nToolUse: number;
  nToolError: number;
  nHookBlocks: number;
  nUserCorrections: number;
  nPreferences: number;
  hookBlocks: DigestSignal[];
  userCorrections: DigestSignal[];
  toolErrors: DigestSignal[];
  preferences: DigestPreference[];
  skills: string[];
  models: string[];
};

const HOOK_BLOCK_RE = /stop hook|hook blocking|PreToolUse hook|hook feedback/i;
const CORRECTION_RE =
  /^\s*(no[,.! ]|nope|stop[,.! ]|wrong|that'?s not|don'?t |actually[, ]|why did you|you (did|should have|were supposed)|undo|revert)/i;
/** Explicit anchors only — bare "always"/"prefer" produced false positives. */
const PREFERENCE_RE = /(?:please remember|from now on)[:\s]+(.{10,200})/i;
const PREFERENCE_DENY_RE = /\b(?:pong|ping)\b|\/health/i;

/** Push while bounding array length; the caller always increments the count. */
function sample<T>(arr: T[], item: T): void {
  if (arr.length < DIGEST_SIGNAL_CAP) arr.push(item);
}

/** One shape, one place — both digest paths start here. */
function emptyDigest(file: string, opts: { source: string; projectKey?: string }): SessionDigest {
  return {
    id: path.basename(file).replace(/\.(jsonl|vscdb)$/i, ""),
    source: opts.source,
    path: file,
    projectKey: opts.projectKey ?? path.basename(path.dirname(file)),
    sessionTs: 0,
    bytes: 0,
    truncated: false,
    malformed: 0,
    nUser: 0,
    nAssistant: 0,
    nToolUse: 0,
    nToolError: 0,
    nHookBlocks: 0,
    nUserCorrections: 0,
    nPreferences: 0,
    hookBlocks: [],
    userCorrections: [],
    toolErrors: [],
    preferences: [],
    skills: [],
    models: [],
  };
}

/** Classify one text blob into a digest. Shared by the JSONL and .vscdb paths so a
 * Cursor session is never scored by different rules than a Claude one. */
function classifyText(d: SessionDigest, text: string, lineNo: number, isUser: boolean): void {
  const head = text.slice(0, 400);
  if (HOOK_BLOCK_RE.test(head)) {
    d.nHookBlocks += 1;
    sample(d.hookBlocks, { line: lineNo, snip: head.slice(0, 200) });
  } else if (CORRECTION_RE.test(head)) {
    d.nUserCorrections += 1;
    sample(d.userCorrections, { line: lineNo, snip: head.slice(0, 200) });
  }
  if (isUser) {
    const pref = text.trim().match(PREFERENCE_RE);
    if (pref && !PREFERENCE_DENY_RE.test(pref[1])) {
      d.nPreferences += 1;
      sample(d.preferences, { line: lineNo, span: pref[1].trim() });
    }
  }
}

/**
 * Digest a Cursor `.vscdb` (read-only SQLite) session. Bounded by the query, not
 * streamed — these stores are small, unlike the multi-GB JSONL transcripts. Closing
 * BL-DRM-016: the digest path enumerated *.jsonl only, so this corpus silently left
 * the dream when the streaming layer landed.
 */
export async function digestVscdbFile(
  file: string,
  opts: { source: string; projectKey?: string },
): Promise<SessionDigest> {
  const { readVscdbTurns } = await import("../corpus/cursor.js");
  const turns = await readVscdbTurns(file);
  const d = emptyDigest(file, opts);
  let line = 0;
  for (const t of turns) {
    line += 1;
    const isUser = t.role === "user" || t.role === "human";
    if (isUser) d.nUser += 1;
    else if (t.role === "assistant") d.nAssistant += 1;
    if (t.text) classifyText(d, String(t.text), line, isUser);
  }
  d.bytes = await stat(file)
    .then((x) => x.size)
    .catch(() => 0);
  d.sessionTs = await stat(file)
    .then((x) => x.mtimeMs)
    .catch(() => 0);
  return d;
}

export async function digestTranscriptFile(
  file: string,
  opts: { source: string; projectKey?: string; maxBytes?: number },
): Promise<SessionDigest> {
  const maxBytes = opts.maxBytes ?? DIGEST_MAX_BYTES;
  const d: SessionDigest = emptyDigest(file, opts);

  const stream = createReadStream(file, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Number.POSITIVE_INFINITY });
  let lineNo = 0;
  try {
    for await (const line of rl) {
      lineNo += 1;
      d.bytes += Buffer.byteLength(line, "utf8") + 1;
      if (d.bytes > maxBytes) {
        // Stop reading, but keep everything already counted. A size ceiling is a
        // bounded read, not a parse failure — conflating the two made an OOM-class
        // event indistinguishable from corrupt JSONL in the system this replaces.
        d.truncated = true;
        break;
      }
      if (!line.trim()) continue;

      let obj: Record<string, unknown>;
      try {
        obj = JSON.parse(line) as Record<string, unknown>;
      } catch {
        d.malformed += 1;
        continue;
      }

      const ts = Date.parse(String(obj.timestamp ?? ""));
      if (!Number.isNaN(ts) && ts > d.sessionTs) d.sessionTs = ts;

      const message = obj.message as Record<string, unknown> | undefined;
      if (!message) continue;
      const role = String(message.role ?? obj.type ?? "unknown");
      const model = message.model ? String(message.model) : "";
      if (model && !d.models.includes(model)) d.models.push(model);

      const content = message.content;
      const parts = Array.isArray(content) ? content : [];
      const texts: string[] = typeof content === "string" ? [content] : [];

      if (role === "assistant") {
        d.nAssistant += 1;
        for (const part of parts) {
          const p = part as Record<string, unknown>;
          if (p.type === "tool_use") {
            d.nToolUse += 1;
            const name = String(p.name ?? "");
            if (name.toLowerCase() === "skill") {
              const input = (p.input ?? {}) as Record<string, unknown>;
              const s = String(input.skill ?? input.name ?? "unknown");
              if (!d.skills.includes(s)) d.skills.push(s);
            }
          } else if (p.type === "text") {
            texts.push(String(p.text ?? ""));
          }
        }
      } else if (role === "user" || role === "human") {
        d.nUser += 1;
        for (const part of parts) {
          const p = part as Record<string, unknown>;
          if (p.type === "tool_result") {
            if (p.is_error) {
              d.nToolError += 1;
              sample(d.toolErrors, { line: lineNo, snip: String(p.content ?? "").slice(0, 200) });
            }
          } else if (p.type === "text") {
            texts.push(String(p.text ?? ""));
          }
        }
      }

      for (const t of texts) {
        // Classify FIRST, then sample. Doing the cap check inside the branch
        // condition is what let hook overflow fall through and be recorded as user
        // corrections (95.7% of that channel was contaminated before it was found).
        classifyText(d, t, lineNo, role === "user" || role === "human");
      }
    }
  } finally {
    rl.close();
    stream.destroy();
  }

  if (d.sessionTs === 0) {
    // No parsable turn timestamps; fall back to the file clock rather than "now",
    // which would make every rebuilt digest look brand new.
    d.sessionTs = await stat(file)
      .then((s) => s.mtimeMs)
      .catch(() => 0);
  }
  return d;
}

/** Walk roots for *.jsonl and *.vscdb WITHOUT reading them (O(1) memory). */
export async function enumerateJsonl(roots: string[]): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const out: string[] = [];
  const walk = async (dir: string, depth: number) => {
    if (depth > 6) return;
    let ents: Awaited<ReturnType<typeof readdir>>;
    try {
      ents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) await walk(abs, depth + 1);
      else if (e.isFile() && (e.name.endsWith(".jsonl") || e.name.endsWith(".vscdb")))
        out.push(abs);
    }
  };
  for (const r of roots) await walk(r, 0);
  return out;
}

export type DigestCorpusResult = {
  digests: SessionDigest[];
  scanned: number;
  included: number;
  excluded_permission: number;
  truncated: number;
  malformed: number;
};

/**
 * Stream every transcript under `roots` into digests. Peak memory is one line plus
 * the digest array — never a transcript, and never the corpus.
 */
export async function digestRoots(opts: {
  roots: string[];
  source: string;
  projectKey?: string;
  maxBytes?: number;
  maxSessions?: number;
}): Promise<DigestCorpusResult> {
  const files = await enumerateJsonl(opts.roots);
  const res: DigestCorpusResult = {
    digests: [],
    scanned: 0,
    included: 0,
    excluded_permission: 0,
    truncated: 0,
    malformed: 0,
  };
  for (const file of files) {
    res.scanned += 1;
    const projectKey = path.basename(path.dirname(file));
    if (opts.projectKey && projectKey !== opts.projectKey) {
      res.excluded_permission += 1;
      continue;
    }
    try {
      const d = file.toLowerCase().endsWith(".vscdb")
        ? await digestVscdbFile(file, { source: opts.source, projectKey })
        : await digestTranscriptFile(file, {
            source: opts.source,
            projectKey,
            maxBytes: opts.maxBytes,
          });
      if (d.truncated) res.truncated += 1;
      res.malformed += d.malformed;
      res.digests.push(d);
      res.included += 1;
    } catch {
      // Unreadable file: counted, never fatal, and never conflated with truncation.
      res.malformed += 1;
    }
  }
  // Newest sessions first BY SESSION CLOCK, then bound. Ordering by file mtime would
  // make a rebuilt corpus look like it all happened at once.
  res.digests.sort((a, b) => b.sessionTs - a.sessionTs);
  if (opts.maxSessions != null && res.digests.length > opts.maxSessions) {
    res.digests = res.digests.slice(0, opts.maxSessions);
  }
  return res;
}

export type PrevalencePattern = {
  kind: "tool_error" | "hook_block" | "user_correction" | "preference";
  key: string;
  k: number;
  n: number;
  sessions: string[];
  citations: Array<{ session: string; line: number; snip: string }>;
  occurrences: number;
};

/** Collapse a noisy signal to a comparable key: lowercase, strip digits/paths/hex. */
export function signalKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[a-z]:\\[^\s'"]+|\/[^\s'"]{4,}/g, "<path>")
    .replace(/\b[0-9a-f]{7,}\b/g, "<hash>")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * A pattern must appear in at least `minSessions` DISTINCT sessions. Prevalence is
 * counted, never asserted — and a thing seen once is not a pattern, it is an
 * anecdote.
 */
export function minePrevalence(
  digests: SessionDigest[],
  opts: { minSessions?: number } = {},
): PrevalencePattern[] {
  const minSessions = opts.minSessions ?? 2;
  const n = digests.length;
  const buckets = new Map<
    string,
    {
      kind: PrevalencePattern["kind"];
      key: string;
      sessions: Set<string>;
      citations: PrevalencePattern["citations"];
      occurrences: number;
    }
  >();

  const add = (
    kind: PrevalencePattern["kind"],
    raw: string,
    sessionId: string,
    line: number,
    snip: string,
    occurrences: number,
  ) => {
    const key = signalKey(raw);
    if (!key) return;
    const id = `${kind}::${key}`;
    let b = buckets.get(id);
    if (!b) {
      b = { kind, key, sessions: new Set(), citations: [], occurrences: 0 };
      buckets.set(id, b);
    }
    b.sessions.add(sessionId);
    b.occurrences += occurrences;
    if (b.citations.length < 8) b.citations.push({ session: sessionId, line, snip });
  };

  for (const d of digests) {
    for (const e of d.toolErrors) add("tool_error", e.snip, d.id, e.line, e.snip, 1);
    for (const h of d.hookBlocks) add("hook_block", h.snip, d.id, h.line, h.snip, 1);
    for (const c of d.userCorrections) add("user_correction", c.snip, d.id, c.line, c.snip, 1);
    for (const p of d.preferences) add("preference", p.span, d.id, p.line, p.span, 1);
  }

  const out: PrevalencePattern[] = [];
  for (const b of buckets.values()) {
    if (b.sessions.size < minSessions) continue;
    out.push({
      kind: b.kind,
      key: b.key,
      k: b.sessions.size,
      n,
      sessions: [...b.sessions],
      citations: b.citations,
      occurrences: b.occurrences,
    });
  }
  // Strongest evidence first: more sessions, then more occurrences.
  out.sort((a, b) => b.k - a.k || b.occurrences - a.occurrences || a.key.localeCompare(b.key));
  return out;
}
