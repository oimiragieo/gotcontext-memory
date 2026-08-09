# Honesty

**Related:** [Documentation hub](./README.md) · [START-HERE](./START-HERE.md) ·
[Harness matrix](./adapters/harness-matrix.md)

## What this package claims

- **Dreaming** = scan permission-scoped transcripts → write **proposals only** →
  human `review accept|reject`. Canonical memory changes only on accept through
  `MemoryStore.commitCanonical` / `deleteCanonical` (CAS + secret scan + MEMORY.md caps).
- Parity target: omega / house **transcript_dream HITL** loop only.
- We do **not** claim parity with omega-orchestrator `memory_dream` auto-supersede.
- Fresh install never dreams unprompted (`dream.enabled` default false; no scheduler in v1).
- Version is **0.9.0** until CEO publish gate + CI matrix green on a clean checkout for `1.0.0`.

## Adapter / corpus matrix

| Harness | Install fragment | Corpus importer |
|---|---|---|
| Claude Code | CLAUDE.md managed block | Full — fixture-pinned Claude JSONL (incl. Skill tool_use when present) |
| Codex | AGENTS.md managed block | Full turns — fixture-pinned Codex JSONL; tool/skill metadata often empty in fixtures |
| Cursor | `.cursor/rules/*.mdc` | Full turns — JSONL + read-only `node:sqlite` `.vscdb`; tool/skill metadata partial |
| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
| OpenCode | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |

## Caps & CAS

- MEMORY.md hard caps: ~200 lines / 25KB — reject, never auto-truncate.
- `memoryTreeHash` covers `memory/**` + `MEMORY.md` only (not proposals/revisions/receipts).
- Human edits outside the CLI are allowed; the **caller** must supply `baseHash` equal to
  current on-disk bytes (or `absent`). There is no silent reconciliation workflow in v1 —
  `doctor` reports dangling index entries and `receipts/*.error.json` accept failures (`INDEX_DRIFT_OR_CAS`);
  `commitCanonical` refuses stale CAS.

## Uninstall

- `gotcontext-memory uninstall` restores each touched adapter file from the
  installer manifest `preImageBase64` (byte-faithful) when a pre-image existed;
  files created solely by install strip the managed block.

## Scope / permission note

- Project filtering uses parent-directory basename (`projectKey`) against fixture roots
  and CLI-supplied roots. This is **fixture-level / partial path identity**, not a
  full harness workspace ACL. Do not read “permission-scoped” as OS permission enforcement.

---

← [Hub](./README.md) · [Security model](./architecture/security-model.md)
