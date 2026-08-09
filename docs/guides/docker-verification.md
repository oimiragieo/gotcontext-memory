# Docker verification (multi-harness)

**Host:** Windows PowerShell + Docker Desktop (not the WSL `docker` socket).

```powershell
pwsh -File scripts/docker-verify.ps1              # all harnesses
pwsh -File scripts/docker-verify.ps1 -Harness codex
npm run verify:docker
```

---

## Images

| Image | Dockerfile | CLI install |
|---|---|---|
| `gotcontext-memory-base` | `Dockerfile.base` | toolkit only |
| `gotcontext-memory-claude` | `Dockerfile.claude` | `npm i -g @anthropic-ai/claude-code` |
| `gotcontext-memory-codex` | `Dockerfile.codex` | `npm i -g @openai/codex` |
| `gotcontext-memory-opencode` | `Dockerfile.opencode` | `npm i -g opencode-ai` |
| `gotcontext-memory-agy` | `Dockerfile.agy` | `curl …/antigravity.google/cli/install.sh` |
| `gotcontext-memory-cursor` | `Dockerfile.cursor` | **stub** `cursor` on PATH (no official Linux headless IDE CLI) |

Per-harness reports: `docker/out/<harness>/VERIFY_REPORT.md`  
Matrix rollup: `docker/out/MATRIX_SUMMARY.md`

---

## What each harness proves

Shared: `gotcontext-memory` on PATH, `init` + adapter markers, `doctor`, project init
(DV-002), export/import, uninstall (DV-003), in-image `npm test` + lint.

| Harness | Corpus dogfood |
|---|---|
| claude / codex / cursor | Seed package fixtures into `defaultCorpusRoots()` → dream → accept |
| agy / opencode | PARTIAL: seed placeholder files → dream must report `EMPTY_CORPUS` with `scanned>0` |

Dream roots live in `src/corpus/roots.ts` (not under the store).

---

## Issues found in dogfood

| ID | Symptom | Fix |
|---|---|---|
| DV-001 | Global bin no shebang | `#!/usr/bin/env node` on `cli.ts` |
| DV-002 | `init --project` retargeted home adapters | `skipHomeAdapters` |
| DV-003 | Uninstall restored managed markers | Preface-only preImage + strip on uninstall |
| DV-004 | `dream --source` for non-claude read `$store/fixtures/…` (wrong) | `defaultCorpusRoots()` per harness |
| DV-005 | `--store project import` from wrong cwd looked at `$WORK/.gotcontext` | Run import with `cwd` = project dir |

---

## Honesty

- Cursor image uses a **stub binary**; product surfaces verified are the adapter path and corpus importer.
- agy/OpenCode corpus remains **PARTIAL** until real transcript parsers land — verify asserts that honesty, not fake proposals.
