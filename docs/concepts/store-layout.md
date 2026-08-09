# Store layout

**Code:** `MemoryStore.initStore` in `src/store.ts`  
**Related:** [mental-model](./mental-model.md) · [memory-store feature](../features/memory-store.md)

---

## Directory tree (after `init`)

```text
<store-root>/
├── MEMORY.md                 # canonical index
├── config.json               # dream/secrets/memory policy
├── commits.jsonl             # append-only journal of canonical ops
├── installer-manifest.json   # operational — adapter install record
├── memory/                   # canonical notes (*.md)
├── proposals/
│   ├── <id>.json             # pending
│   ├── accepted/<id>.json
│   └── rejected/<id>.json
├── revisions/
│   ├── memory__foo.<hash12>.md
│   └── memory__foo.<hash12>.meta.json
├── receipts/
│   ├── <id>.json             # accept ok
│   ├── <id>.error.json       # accept failure (e.g. INDEX_DRIFT_OR_CAS)
│   └── import-<ts>.json
└── locks/                    # lock stubs for not-yet-existing files
```

---

## What each folder is for

### `MEMORY.md` (canonical)

Generated listing of memory files. Format of each line:

```markdown
- [Title](memory/foo.md) — short hook
```

Regenerated on accept/import via `regenerateIndex` (`src/index.ts`). Caps:
~200 lines / 25KB — see [memory-index.md](../features/memory-index.md).

### `memory/` (canonical)

Individual notes. Typical shape:

```markdown
---
title: Prefer conventional commits
description: Use Conventional Commits in this repo
---

Use Conventional Commits for all git history.
```

Frontmatter parsed by `src/frontmatter.ts`. Optional `expires` ISO timestamp
hides the entry from the index once past (filtering uses `nowMs` when provided).

### `proposals/` (operational)

Dream output. Pending files are only `*.json` directly under `proposals/`
(not in subfolders). Ids must match `^[A-Za-z0-9._-]{1,128}$`.

### `revisions/` (operational)

Before overwriting/deleting a canonical file, the store writes:

- Prior body: `<path-with-__>.<hash12>.md`
- Metadata: same stem + `.meta.json` (hash, provenance, allowlist, timestamps)

Used by `history()` and `rollback()`.

### `receipts/` (operational)

Durable diagnostics. Doctor surfaces `*.error.json` as
`accept_error_receipt` failures.

### `config.json` (operational)

See [config-schema.md](../reference/config-schema.md). Default
`dream.enabled: false`. Forbidden keys: `dream.schedule`, `dream.auto`.

### `commits.jsonl` (operational)

One JSON object per line for each successful `commitCanonical` /
`deleteCanonical`. Audit trail, not a full event bus.

### `installer-manifest.json` (operational)

Written by `init` through `commitOperational`. Uninstall reads it via
`MemoryStore.read` and clears it via `commitOperational` — never raw write
into the store for the manifest.

---

## What is *not* in the store

Harness instruction files (`~/.claude/CLAUDE.md`, `AGENTS.md`,
`.cursor/rules/…`) live outside. The installer may write those; it must refuse
if a target resolves under the store root.

---

## Path containment

All relative paths into the store go through `assertSafeRelativePath` /
`resolveUnderStore` (`src/paths.ts`):

- Reject `..`, absolute paths, drive letters, UNC, `~`
- Walk ancestors with `lstat`; reject symlink escapes outside the real store root

Next → [cas-and-hashing.md](./cas-and-hashing.md)
