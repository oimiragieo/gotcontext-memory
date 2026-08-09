# Feature: Installer and harness adapters

**Code:** `src/installer.ts`, `src/adapters/types.ts`  
**Tests:** `test/installer.test.ts`  
**Related:** [harness matrix](../adapters/harness-matrix.md)

---

## Purpose

Teach each coding harness where memory lives and that writes must go through
`gotcontext-memory` / MCP — without forking five divergent rule documents.

---

## Adapters (v0.9)

| id | Fragment path |
|---|---|
| `claude-code` | `~/.claude/CLAUDE.md` |
| `agy` | `<cwd>/AGENTS.md` |
| `codex` | `~/.codex/AGENTS.md` |
| `opencode` | `<cwd>/AGENTS.md` |
| `cursor` | `<cwd>/.cursor/rules/gotcontext-memory.mdc` |

All five currently `detect(): true` (always attempt). Shared fragment text comes
from one `fragment(storeHint)` function — parity tested verbatim for key
sentences.

Markers:

```html
<!-- gotcontext-memory:begin -->
…
<!-- gotcontext-memory:end -->
```

If `memory.policy` is non-empty in the store config, extra bullet lines are
injected before the end marker.

---

## `installFragments`

1. Refuse if target resolves under `storeRoot`
2. Deduplicate same absolute path in one run (agy + opencode → one `AGENTS.md`)
3. If managed block exists and differs → throw unless `force`
4. Upsert block; preserve user preface outside markers
5. Record `preImageBase64` + `blockHash` in manifest entries — preImage is the
   preface **after stripping** any existing managed block (so re-init / volume
   leftovers cannot snapshot markers as the restore target; DV-003)
6. `skipHomeAdapters` (set by `init --project`): do not touch paths under `$HOME`
   (`~/.claude`, `~/.codex`). Those belong to the user store; project init only
   stamps cwd-local fragments (DV-002).

`init` persists the manifest via `commitOperational` and always passes `storeRoot`.

### Dry-run

Computes `planned` paths and performs tamper checks logic without writing
adapter files (still must not mutate store tree hash).

---

## `uninstallFragments({ store })`

1. Read `installer-manifest.json` through `MemoryStore.read`
2. For each entry: restore `preImageBase64` **or** strip managed block
3. Refuse if a manifest path points inside the store root
4. Clear manifest via `commitOperational` (sole-writer compliant)

---

## Binary naming note

Prefer `gotcontext-memory`. The `gcm` alias can collide with **Git Credential
Manager** on Windows — the CLI prints this warning on init.

← [review](./review.md) · Next → [doctor.md](./doctor.md)
