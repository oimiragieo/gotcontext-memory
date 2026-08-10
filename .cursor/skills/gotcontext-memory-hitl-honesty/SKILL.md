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

For **scale/digests** load `gotcontext-memory-streaming-digests`.  
For **resurrection/prevalence** load `gotcontext-memory-claim-lifecycle`.  
Registry: `docs/SKILLS.md`.

## Do not confuse

| System | Brain | Store | Auto-apply? |
|---|---|---|---|
| gotcontext-memory | Regex + windowed prevalence (+ HITL) | markdown `~/.gotcontext` | Never |
| omega `transcript_dream` | LLM reviewer | SQLite proposals | Never (HITL) |
| omega `memory_dream` | consolidator | facts DB | Yes (auto) |

Parity target = **HITL shape only**, not LLM brain or auto-supersede.

## Load-bearing rules (lessons L1–L20)

1. **Fake-green tests** — never catch `ReferenceError` as skip; only EPERM/EACCES/ENOTSUP.
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
12. **No resurrection** — rejected → `claimKey` from `proposals/rejected/`; accepted prefs → skip when `storeHashes` already has `targetPath` (do not re-propose create over live notes).
13. **Prevalence window** — `--max-sessions` (default 400); sort by evidence strength.
14. **Dirty-tree commits** — stage only your paths; strip `.tensor-grep/` before merge.
15. **Cursor `.vscdb`** — digest path currently skips it; must re-wire before 1.0.0 (BL-DRM-016).
16. **Secret fixtures** — never commit contiguous live-shaped tokens; split strings for scanners (push protection).

## Authority

- `docs/HONESTY.md`, `docs/LESSONS_2026-08-09.md`, `docs/BACKLOG.md`, `docs/CEO_UPDATE_2026-08-09.md`
- Sibling: `transcript-dream-hitl` (omega/JARVIS)
- Companions: `gotcontext-memory-streaming-digests`, `gotcontext-memory-claim-lifecycle`

## Verify

```bash
cd gotcontext-memory && npm test && npm run lint && npm run build
```
