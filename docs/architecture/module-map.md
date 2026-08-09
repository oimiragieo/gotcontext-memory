# Module map

**Related:** [overview](./overview.md) · source under `src/`

Each row is “start reading here if you need to change X.”

---

## Entry & orchestration

| Module | Role |
|---|---|
| `src/cli.ts` | Commander program: `init`, `uninstall`, `dream`, `review`, `doctor`, `export`, `import`, `mcp`. Resolves store tier via `openStore`. |
| `src/mcp/server.ts` | Stdio JSON-RPC loop (`initialize`, `tools/list`, `tools/call`). |
| `src/mcp/handlers.ts` | In-process tool implementations (also unit-tested without stdio). |

---

## Core store

| Module | Role |
|---|---|
| `src/store.ts` | `MemoryStore`, `LockedStore`, CAS, locks, revisions, journal, rollback. |
| `src/paths.ts` | User/project roots, ambiguous-store refusal, path containment + symlink walk. |
| `src/hash.ts` | `sha256Hex`, `memoryTreeHash`, `fileExists`. |
| `src/config.ts` | Load/validate `config.json`; `defaultConfigJson()` for init (store writes bytes). |
| `src/frontmatter.ts` | Parse/serialize YAML frontmatter for memory notes. |
| `src/secrets.ts` | Pattern list + `SecretDetected` error. |
| `src/index.ts` | Pure `regenerateIndex(store, overlay?, { nowMs? })`. |

---

## Dream / review loop

| Module | Role |
|---|---|
| `src/dream/run.ts` | `runDream`, `extractProposals`, `proposalId`, staleness expire pass. |
| `src/dream/policy.ts` | `excludeSources`, `focus`, fragment lines for `memory.policy`. |
| `src/review.ts` | `list` / accept / reject; `assertProposalId`; preflight + rollback. |

---

## Corpus

| Module | Role |
|---|---|
| `src/corpus/types.ts` | `CorpusSource`, `Transcript`, `ScanResult` contracts. |
| `src/corpus/claude.ts` | Claude Code JSONL (+ Skill tool_use). |
| `src/corpus/codex.ts` | Codex JSONL `{role,text,ts}` (+ Claude-shaped migration lines). |
| `src/corpus/cursor.ts` | JSONL + read-only `node:sqlite` for `.vscdb`. |
| `src/corpus/agy.ts` | PARTIAL stub. |
| `src/corpus/opencode.ts` | PARTIAL stub. |

---

## Install / ops

| Module | Role |
|---|---|
| `src/adapters/types.ts` | Five adapters + shared fragment text + markers. |
| `src/installer.ts` | Managed-block upsert, tamper detection, uninstall with pre-images. |
| `src/doctor.ts` | Read-only diagnostics report. |
| `src/portability.ts` | Gzip JSONL archive export/import. |

---

## Tests (where behavior is proven)

| File | Proves |
|---|---|
| `test/store.test.ts` | CAS, tree hash, path containment, cross-process race |
| `test/store-extra.test.ts` | Absolute/drive rejection, symlink escape, delete/rollback |
| `test/secrets.test.ts` | Pattern arms + config allowlist |
| `test/dream.test.ts` | Dream hash invariant, accept, cap preflight, policy exclude |
| `test/corpus.test.ts` | Importers + stubs |
| `test/installer.test.ts` | Dry-run, uninstall restore, tamper, fragment parity |
| `test/doctor.test.ts` | EMPTY label, dangling index |
| `test/portability.test.ts` | Round-trip content, secret import reject |
| `test/mcp.test.ts` | Stale CAS + secret via handlers |
| `test/guards.test.ts` | AST sole-writer + runtime containment |
| `test/config.test.ts` | Schema + tier resolution |

Guide: [contributing-tests.md](../guides/contributing-tests.md).

Next → [data-flow.md](./data-flow.md)
