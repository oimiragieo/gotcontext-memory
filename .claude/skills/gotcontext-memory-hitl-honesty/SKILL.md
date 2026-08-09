---
name: gotcontext-memory-hitl-honesty
description: >
  Use when working on gotcontext-memory (markdown HITL dream, MemoryStore CAS,
  MCP tools, doctor caps, preference extraction) or when comparing it to omega
  transcript_dream / memory_dream. Enforces HITL honesty, lock/index rules,
  inert-test traps, and no false parity claims.
---

# gotcontext-memory HITL honesty

## When to use

- Editing `gotcontext-memory` dream / store / review / MCP / doctor / corpus
- Claims about “same as JARVIS/omega dream”
- Auditing preference extraction or concurrent accept

## Do not confuse

| System | Brain | Store | Auto-apply? |
|---|---|---|---|
| gotcontext-memory | Regex (+ HITL) | markdown `~/.gotcontext` | Never |
| omega `transcript_dream` | LLM reviewer | SQLite proposals | Never (HITL) |
| omega `memory_dream` | consolidator | facts DB | Yes (auto) |

Parity target for gotcontext = **HITL shape only**, not LLM or auto-supersede.

## Load-bearing rules (lessons L1–L20)

1. **Fake-green tests** — never catch `ReferenceError` as skip; only EPERM/EACCES.
2. **Detect≠enforce** — doctor caps must fail when over; share `countIndexLines`.
3. **One lock key** — always `locks/<sha256(rel)>.lock`.
4. **Index under lock** — regenerate MEMORY.md after target mutate, still locked; multi-process oracle.
5. **MCP** — `memory_read` = MEMORY.md|memory/**; `memory_commit` default-off (`mcp.allowCommit`).
6. **Prior PASS ≠ closed** — re-audit after security claims.
7. **Alive ≠ useful** — report staged content + accepts, not only run success.
8. **Preference FP** — require `please remember`|`from now on`; deny pong/ping/health.
9. **Overlay types** — `deletes: []` not `{}`.
10. **dream.enabled** — enforce or stop pretending; CLI needs `--force` when false.
11. **Scale** — stream digests; never `readFile` whole multi-GB transcripts; truncated ≠ malformed.
12. **No resurrection** — suppress rejected/accepted claims via `claimKey`.
13. **Prevalence window** — `--max-sessions` (default 400); sort by evidence strength.
14. **Dirty-tree commits** — stage only your paths; strip `.tensor-grep/` before merge.
15. **Cursor `.vscdb`** — digest path currently skips it; must re-wire before 1.0.0.

## Authority

- `gotcontext-memory/docs/HONESTY.md`
- `gotcontext-memory/docs/LESSONS_2026-08-09.md`
- `gotcontext-memory/docs/BACKLOG.md`
- `gotcontext-memory/docs/CEO_UPDATE_2026-08-09.md`
- Sibling skill: `transcript-dream-hitl` (omega/JARVIS)

## Verify

```bash
cd gotcontext-memory && npm test && npm run lint && npm run build
```
EOF