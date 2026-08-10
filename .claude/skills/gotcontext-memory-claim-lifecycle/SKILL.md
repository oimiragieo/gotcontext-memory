---
name: gotcontext-memory-claim-lifecycle
description: >
  Use when fixing proposal resurrection, rejected/accepted claim reappearance,
  cross-session prevalence spam, maxProposals ordering, preference false positives,
  or claimKey / --max-sessions behavior in gotcontext-memory dreaming.
---

# gotcontext-memory — claim lifecycle

Companion to `gotcontext-memory-hitl-honesty` and `gotcontext-memory-streaming-digests`.

## Core ideas

- **Promotion is HITL** — dream only stages; humans accept/reject.  
- **Rejected claims have `claimKey` identity** — `claimKey(targetPath, body)` is stable across
  runs and **independent of `base_hash`** so rejects still suppress the next identical body.  
- **Accepted prefs are settled by path presence** — if `storeHashes` already has `targetPath`,
  skip re-`create` (protects human edits). Do not pretend accepts are archived under `claimKey`.  
- **Prevalence without a window is noise** — unbounded k/n (e.g. `16/17263`) is true and useless.

## Rules

1. **No resurrection (two mechanisms)** — (a) `loadSuppressedClaims` from `proposals/rejected/**`
   via `claimKey`; (b) preference extract skips when the target file already exists in the store.
   Red tests in `test/dream-suppression.test.ts`.
2. **`claimKey` ≠ `proposalId`** — proposal id may include `base_hash` / evidence material;
   rejected-claim suppression must not, or CAS drift re-stages the same advice forever.
3. **Window prevalence** — CLI `--max-sessions` (default **400**) per source; report k/n
   against that window only (`src/cli.ts`, `digestRoots`).
4. **Sort by evidence strength** — before `maxProposals` slice: `evidence.length` desc,
   then path/id. Never order survivors by sha256 id prefix.
5. **Preference FP hose** — anchors `please remember` | `from now on` only; deny
   pong/ping/`/health` (L11). Bare `always`/`prefer` is forbidden without new FP tests.
6. **Alive ≠ useful (L7)** — receipts must include staged content quality + accepts, not
   only “dream run succeeded.”

## Signals today (regex / counts — not LLM)

| Signal | Source |
|---|---|
| Preferences | Digest preference spans |
| Prevalence | tool errors, hook blocks, user corrections across window |
| Expire | Staleness pass on memory frontmatter |

## Authority

- Lessons **L7**, **L11**, **L16**, **L17**  
- Code: `claimKey` / `runDreamFromDigests` in `src/dream/run.ts`  
- `docs/features/dream.md`, `docs/HONESTY.md`  
- Prior art: selective promotion / late filtering — `docs/research/2026-08-09-agent-memory-prior-art.md`

## Verify

```bash
cd gotcontext-memory && npm test -- test/dream-suppression.test.ts test/dream.test.ts
```
