# Transcript formats (fixture-pinned)

**Related:** [Harness matrix](./harness-matrix.md) · [Corpus importers](../features/corpus-importers.md) ·
[Hub](../README.md)

These formats are the **test contract**. Live machine layouts may drift; fixtures win.

## Claude Code JSONL (v1)

- Path pattern: `<root>/<project-slug>/*.jsonl`
- Line: JSON object with `message.role`, `message.content` (string or content-block array), optional `timestamp`
- Skill invocations: `content[]` entry `type=tool_use` with `name=Skill` (or `skill`)

Fixtures: `test/fixtures/transcripts/claude/`

## Codex JSONL (v1)

- Path pattern: `<root>/<project-slug>/*.jsonl`
- Line: `{ "role": "user"|"assistant", "text": "...", "ts": "ISO-8601" }`
- Claude-shaped migration lines also accepted for mixed fixtures

Fixtures: `test/fixtures/transcripts/codex/`

## Cursor (v1)

### JSONL

- Same walk as Claude/Codex under fixture roots; Claude message shape or `{role,text}` accepted.

### SQLite `state.vscdb` / `*.vscdb` (read-only `node:sqlite`)

- Fixture table: `ItemTable(key TEXT, value TEXT)`
- Keys: `composerData:<id>` → JSON `{ "bubbles": [ { "type"|"role", "text" } ] }`
- Or bubble rows with `{ "text", "role" }`

Fixtures: `test/fixtures/transcripts/cursor/`

## agy / OpenCode

Labeled **PARTIAL** — scanners enumerate candidate paths and return zero transcripts
with an honest label until dogfood receipts exist.

← [Harness matrix](./harness-matrix.md) · [Hub](../README.md)
