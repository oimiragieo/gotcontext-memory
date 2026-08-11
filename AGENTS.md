# AGENTS.md — gotcontext-memory

Instructions for any coding agent working in this repo.

## Read first

1. [`docs/HONESTY.md`](docs/HONESTY.md) — what we claim vs do not claim  
2. [`docs/BACKLOG.md`](docs/BACKLOG.md) — **complete** open work list  
3. [`docs/LESSONS_2026-08-09.md`](docs/LESSONS_2026-08-09.md) — load-bearing lessons **L1–L24**  
4. [`docs/CEO_UPDATE_2026-08-09.md`](docs/CEO_UPDATE_2026-08-09.md) — last human brief  
5. [`docs/SKILLS.md`](docs/SKILLS.md) — **skill registry** (load the matching skill before editing)  
6. [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md) — multi-lane evolution workflow  
7. [`docs/guides/rebuild-from-scratch.md`](docs/guides/rebuild-from-scratch.md) — junior rebuild path  
8. [`docs/guides/issue-triage-weekly.md`](docs/guides/issue-triage-weekly.md) — weekly AI/human bug+feature triage  
9. [`CONTRIBUTING.md`](CONTRIBUTING.md) — how outsiders file bugs/features  

## Community issues (bugs / features / weekly AI triage)

- **File here (templates only):** https://github.com/oimiragieo/gotcontext-memory/issues/new/choose  
  - Bug → labels `bug` + `needs-triage`  
  - Feature → labels `enhancement` + `needs-triage`  
  - Blank issues are **disabled**; questions → [Discussions](https://github.com/oimiragieo/gotcontext-memory/discussions)  
- **Weekly digest:** Actions cron `weekly-issue-triage` (Mondays 15:00 UTC) opens/refreshes  
  `Weekly triage YYYY-Www` labeled `triage/weekly` via `scripts/weekly-issue-digest.sh`.  
- **When processing triage:** follow [`docs/guides/issue-triage-weekly.md`](docs/guides/issue-triage-weekly.md) —  
  classify (`area/*`, `priority/p0|p1|p2`), dedupe vs BACKLOG, draft comments, propose BACKLOG IDs.  
  **Do not** close p0/security or merge code without a human. Remove `needs-triage` after classifying.  
- Manual refresh: `bash scripts/weekly-issue-digest.sh` or Actions → Run workflow.

## Skills (load by task)

| Skill | Use when |
|---|---|
| `gotcontext-memory-hitl-honesty` | Dream/store/MCP/review/doctor; omega parity claims |
| `gotcontext-memory-streaming-digests` | Multi-GB corpora, digests, stratified window, `.vscdb`, concurrency |
| `gotcontext-memory-claim-lifecycle` | Resurrection, prevalence, evidence sort, preference FPs |
| `transcript-dream-hitl` | Omega/JARVIS contrast only if installed — **not** gotcontext parity |

Repo copies: `.claude/skills/<name>/` (+ `.cursor/skills/`). Mirror `hitl-honesty` to `~/.claude/skills/` when present. Cursor rule: `.cursor/rules/gotcontext-memory.mdc`.

## Non-negotiables

- Canonical memory writes only via HITL `review accept` (or conscious `mcp.allowCommit: true`).
- Dream writes **proposals only**; never auto-apply; no scheduler in v0.9.
- Dream substrate = **streaming digests** (`src/dream/digest.ts`); stratified `--max-sessions`; concurrent workers; Cursor `.vscdb` **on** the digest path (BL-DRM-016 closed).
- No resurrection: rejected claims via `claimKey` (`proposals/rejected/`); accepted prefs skipped when the target path already exists in the store.
- After accept, use `gotcontext-memory efficacy` to score pattern notes (does not auto-edit memory).
- Do **not** claim parity with omega `memory_dream` or full LLM `transcript_dream`.
- Version stays **0.9.0** until CEO publish gate.
- Sole store-root mutations: `MemoryStore` in `src/store.ts` (AST guard in tests).
- Prefer `tg` over raw grep for symbol/impact work when available.
- Dirty tree: `git add <only-my-paths>`; never stage `.tensor-grep/` under `src/`.
- Research freshness: Exa/`use-exa` when available; otherwise label WebSearch (L13).

## Verification before “done”

```bash
npm test
npm run lint
npm run build
```

Docker dogfood (Windows host): `npm run verify:docker` — CLI dream needs `--force` unless `dream.enabled` is true.

## When fixing concurrency / HITL / MCP / dream scale

- Locks: always `locks/<sha256(rel)>.lock` (L3).  
- Accept: regenerate `MEMORY.md` **under** lock (L4); concurrent process test (L8).  
- MCP: `memory_read` = MEMORY.md|memory/** only; commit default-off (L5).  
- Digests: truncated ≠ malformed (L15); stratified window (L22); `.vscdb` on path (L18 closed).  
- Efficacy: &lt;5 post-accept sessions → INSUFFICIENT_DATA only (L23).  
- Tests: no inert both-arms-pass (L1, L2).

## Do not

- Add daemon/scheduler that writes memory.  
- Re-enable bare `always`/`prefer` preference matching without FP tests.  
- Treat last audit PASS as proof forever (L6).  
- Edit `docs/superpowers/plans/*` checkboxes without verifying against code.  
- Commit tool session caches (`.tensor-grep/`).
