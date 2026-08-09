# AGENTS.md — gotcontext-memory

Instructions for any coding agent working in this repo.

## Read first

1. [`docs/HONESTY.md`](docs/HONESTY.md) — what we claim vs do not claim  
2. [`docs/BACKLOG.md`](docs/BACKLOG.md) — **complete** open work list  
3. [`docs/LESSONS_2026-08-09.md`](docs/LESSONS_2026-08-09.md) — load-bearing lessons L1–L14  
4. [`docs/CEO_UPDATE_2026-08-09.md`](docs/CEO_UPDATE_2026-08-09.md) — last human brief  

Skill (Claude/Cursor): `gotcontext-memory-hitl-honesty` (also at `~/.claude/skills/gotcontext-memory-hitl-honesty/`).

## Non-negotiables

- Canonical memory writes only via HITL `review accept` (or conscious `mcp.allowCommit: true`).
- Dream writes **proposals only**; never auto-apply; no scheduler in v0.9.
- Do **not** claim parity with omega `memory_dream` or full LLM `transcript_dream`.
- Version stays **0.9.0** until CEO publish gate.
- Sole store-root mutations: `MemoryStore` in `src/store.ts` (AST guard in tests).
- Prefer `tg` over raw grep for symbol/impact work when available.

## Verification before “done”

```bash
npm test
npm run lint
npm run build
```

Docker dogfood (Windows host): `npm run verify:docker` — CLI dream needs `--force` unless `dream.enabled` is true.

## When fixing concurrency / HITL / MCP

- Locks: always `locks/<sha256(rel)>.lock` (L3).  
- Accept: regenerate `MEMORY.md` **under** lock (L4); concurrent process test (L8).  
- MCP: `memory_read` = MEMORY.md|memory/** only; commit default-off (L5).  
- Tests: no inert both-arms-pass (L1, L2).

## Do not

- Add daemon/scheduler that writes memory.  
- Re-enable bare `always`/`prefer` preference matching without FP tests.  
- Treat last audit PASS as proof forever (L6).  
- Edit `docs/superpowers/plans/*` checkboxes without verifying against code.
EOF