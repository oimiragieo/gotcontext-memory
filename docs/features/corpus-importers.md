# Feature: Corpus importers

**Code:** `src/corpus/*`  
**Tests:** `test/corpus.test.ts`  
**Formats:** [transcript-formats.md](../adapters/transcript-formats.md) · [harness matrix](../adapters/harness-matrix.md)

---

## Purpose

Turn each harness’s on-disk session logs into a shared `Transcript` shape so
dream extraction does not care which product produced the chat.

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

### Cursor (`cursor.ts`) — FULL turns

1. `*.jsonl` like siblings
2. `*.vscdb` / `state.vscdb` via read-only `node:sqlite` reading `ItemTable`

### agy / OpenCode — PARTIAL

- Enumerate candidate files
- Return zero transcripts + PARTIAL label + per-path messages

---

## CLI root defaults (important)

In `src/cli.ts` today:

- Claude → `~/.claude/projects`
- Other sources → `<storeRoot>/fixtures/<name>`

So for Codex/Cursor dream against live machine logs, operators typically place
or symlink fixtures, or call importers from tests/tools with explicit roots.
This is a common junior footgun — see [troubleshooting](../guides/troubleshooting.md).

---

## Adding a new importer (checklist)

1. Document format in `docs/adapters/transcript-formats.md`
2. Implement `CorpusSource` with EMPTY + positive + malformed arms
3. Add fixtures under `test/fixtures/transcripts/<name>/`
4. Wire into CLI `sources` map
5. Update HONESTY matrix (FULL vs PARTIAL)

← [config-and-tiers](./config-and-tiers.md) · Next → [dream.md](./dream.md)
