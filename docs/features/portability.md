# Feature: Export / import (portability)

**Code:** `src/portability.ts`  
**Tests:** `test/portability.test.ts`, archive-inside-store guard in `test/guards.test.ts`

---

## Purpose

Move a store between machines without inventing a second write path. Import
replays entries through `commitCanonical` / `commitOperational` so secret scan +
CAS + caps still apply.

---

## Archive format

- Absolute path ending wherever you like, typically `*.gcm.gz`
- Content: gzip-compressed JSONL
- Each line: `{ "path": "memory/a.md", "contentBase64": "…" }`

Export includes: `memory/**`, `revisions/**`, `proposals/**`, `MEMORY.md`,
`config.json`.

---

## CLI

```bash
gotcontext-memory export --out /abs/path/out.gcm.gz
gotcontext-memory import --from /abs/path/out.gcm.gz --merge
gotcontext-memory import --from /abs/path/out.gcm.gz --replace
```

`--merge` or `--replace` is mandatory.

---

## Safety rules

1. Archive path must be absolute
2. Export destination must not be inside the store root
3. Import paths pass `assertSafeRelativePath`
4. Secret-bearing memory rows fail `commitCanonical` → `rejected++`
5. Durable receipt: `receipts/import-<timestamp>.json`

---

## Replace vs merge

| Mode | Behavior |
|---|---|
| `merge` | Upsert rows from archive; leave extra local memory files alone |
| `replace` | First `deleteCanonical` any local `memory/**/*.md` absent from archive, then upsert |

---

## What is not exported

Harness credentials, live `~/.claude/projects` transcripts, or adapter files
outside the store. Portability is **store contents**, not a full machine clone.

← [doctor](./doctor.md) · Next → [mcp.md](./mcp.md)
