# Feature: Corpus importers

**Code:** `src/corpus/*`, `src/dream/digest.ts` (CLI dream path)  
**Tests:** `test/corpus.test.ts`  
**Formats:** [transcript-formats.md](../adapters/transcript-formats.md) · [harness matrix](../adapters/harness-matrix.md)

---

## Purpose

Turn each harness’s on-disk session logs into a shared `Transcript` shape for
library/tests, and (for CLI dream) feed the **streaming digest** path so
extraction does not care which product produced the chat.

---

## Contract (`src/corpus/types.ts`)

```ts
type ScanOpts = {
  scope: "user" | "project",
  roots: string[],
  projectKey?: string,
}

type ScanResult = {
  transcripts: Transcript[],
  scanned: number,
  included: number,
  excluded_permission: number,
  malformed: number,
  errors: { path, message }[],
  label: string,  // "EMPTY" | "OK" | "PARTIAL — …"
}
```

**Zero-label law:** an empty directory returns `label: "EMPTY"` and counts, never
a bare `[]` with no explanation.

**CE-8 style accounting:** for scoped scans,
`included + excluded_permission + malformed ≈ scanned` (malformed counted when
a file fails parse after being selected).

---

## Per-source behavior

### Claude (`claude.ts`) — FULL

- Walks `*.jsonl` under roots
- Parses `message.role` / `message.content` (string or content blocks)
- Records `tool_use` and `Skill` invocations into turn metadata

### Codex (`codex.ts`) — FULL turns

- Fixture-pinned `{ role, text, ts }` JSONL
- Also accepts Claude-shaped migration lines
- Tool/skill arrays usually empty in fixtures (documented in HONESTY)

### Cursor (`cursor.ts`) — FULL for dream digests

1. `*.jsonl` — streamed digests like siblings  
2. `*.vscdb` / `state.vscdb` — read-only `node:sqlite` (`ItemTable`), then shared
   `classifyText` (**BL-DRM-016 closed 2026-08-10**). Unreadable `.vscdb` → `malformed`, not fatal.

### agy / OpenCode — PARTIAL

- Enumerate candidate files
- Return zero transcripts + PARTIAL label + per-path messages
- Any `*.jsonl` under default roots can still be digested by CLI dream

---

## CLI root defaults (`defaultCorpusRoots`)

In `src/corpus/roots.ts` (used by `src/cli.ts` dream):

| Source | Default roots |
|---|---|
| Claude | `~/.claude/projects` |
| Codex | `~/.codex/sessions`, `~/.codex/projects` |
| Cursor | `~/.cursor/projects`, `<cwd>/.cursor` |
| agy | `~/.agy/sessions`, `~/.antigravitycli` |
| OpenCode | `~/.opencode/sessions`, `~/.opencode/projects` |

Dogfood may seed package fixtures into these paths (`docker/verify.sh`). Parse
contracts for unit tests live under `test/fixtures/transcripts/<name>/`.

---

## Adding a new importer (checklist)

1. Document format in `docs/adapters/transcript-formats.md`
2. Implement `CorpusSource` with EMPTY + positive + malformed arms
3. Add fixtures under `test/fixtures/transcripts/<name>/`
4. Wire into CLI `sources` map **and** decide digest coverage (`*.jsonl` vs richer)
5. Update HONESTY matrix (FULL vs PARTIAL; note any digest gaps)

← [config-and-tiers](./config-and-tiers.md) · Next → [dream.md](./dream.md)
