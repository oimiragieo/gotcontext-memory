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
12. **No resurrection — TWO mechanisms, not one.** REJECTED claims are suppressed by an
    immutable `claimKey` (`loadSuppressedClaims` reads `proposals/rejected/`, `src/dream/run.ts`).
    ACCEPTED claims are stopped by a SEPARATE settled-state check —
    `if (storeHashes.has(targetPath)) continue;`. Conflating them hides the real bug: accepting a
    re-proposed `create` over a materialised target silently overwrites any human edit made since.
    Never key claim identity on `base_hash` — it changes the instant the target exists, minting a
    "new" id for a settled claim (negative cache / tombstone; a tombstone that never expires is
    itself an anti-pattern).
13. **Prevalence window** — `--max-sessions` (default 400); sort by evidence strength.
14. **Dirty-tree commits** — stage only your paths; strip `.tensor-grep/` before merge.
15. **Cursor `.vscdb`** — on the digest path with shared `classifyText` (BL-DRM-016 closed 2026-08-10).  
16. **Secret fixtures** — never commit contiguous live-shaped tokens; split strings for scanners.  
17. **Stratified window** — not newest-N alone (`selectDigests`).  
18. **Efficacy** — score accepted patterns; thin windows → INSUFFICIENT_DATA only.

## Authority

- `docs/HONESTY.md`, `docs/LESSONS_2026-08-09.md`, `docs/BACKLOG.md`, `docs/CEO_UPDATE_2026-08-09.md`
- Sibling: `transcript-dream-hitl` (omega/JARVIS)
- Companions: `gotcontext-memory-streaming-digests`, `gotcontext-memory-claim-lifecycle`

## Verify

```bash
cd gotcontext-memory && npm test && npm run lint && npm run build
```

17. **Prevalence is clustered by STRING, not by meaning.** `minePrevalence` (`src/dream/digest.ts`)
    buckets by a normalised `signalKey` (lowercased; paths/hashes/digits stripped) and requires
    >=2 DISTINCT sessions before proposing, reporting `k/n sessions` with line-numbered citations.
    Two phrasings of the same problem land in different buckets and are NOT merged. Say "counted",
    never "inferred" — this is not an LLM brain.
18. **`receiptCode` names the cause.** `src/review.ts` returns CAS_CONFLICT, SECRET_DETECTED,
    INDEX_CAP, TARGET_MISSING, INVALID_PROPOSAL, PROPOSAL_EXPIRED, PATH_VIOLATION, or
    INTERNAL_ERROR (fallback for genuinely unrecognised errors only). This replaced filing every
    unrecognised failure as `INDEX_DRIFT_OR_CAS`, which sent operators to reconcile an index that
    was never the problem. Read `receipts/*.error.json` when an accept fails.
19. **Scale is a correctness property.** Whole-file corpus reads die at the V8 string ceiling on a
    real machine; the digest path is load-bearing, not an optimisation. See
    `ingest-a-corpus-that-exceeds-memory`.
