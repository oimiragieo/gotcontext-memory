---
name: gotcontext-memory-streaming-digests
description: >
  Use when dreaming over multi-GB transcript corpora, fixing OOM / heap pressure,
  implementing or auditing SessionDigest streaming, distinguishing truncated from
  malformed reads, or touching Cursor .vscdb vs *.jsonl dream wiring in gotcontext-memory.
---

# gotcontext-memory — streaming digests

Companion to `gotcontext-memory-hitl-honesty`. Load when the problem is **scale**, not HITL policy.

## Why this exists

Measured corpus: **~9.6 GB / 11k+ Claude transcripts**, including a **~2.3 GB** file that
`readFile` rejects (`> 2 GiB`). Accumulating full `Transcript[]` cannot work. Dream must
stream into bounded digests and reason only over digests.

## Rules

1. **Stream, don’t slurp** — `digestTranscriptFile` / `digestRoots` in `src/dream/digest.ts`.
   Hold `SessionDigest` (~1 KB signals), never whole multi-GB strings.
2. **Truncated ≠ malformed** — byte ceiling (`DIGEST_MAX_BYTES`) sets `truncated: true`.
   Parse errors increment `malformed`. Never conflate in receipts or doctor.
3. **Counts vs samples** — `DIGEST_SIGNAL_CAP` bounds *arrays*; always increment *counts*
   even when samples are full.
4. **Window at the digest layer** — `--max-sessions` (default 400) keeps newest digests
   per source (memory **and** prevalence meaning). See claim-lifecycle skill for k/n.
5. **Harness coverage is part of the contract** — digest path globs `*.jsonl` only today.
   Cursor `.vscdb` reader exists (`cursorCorpus`) but is **off** the dream path (**BL-DRM-016**).
   Document in HONESTY when a scale fix drops a harness; do not silently shrink coverage.
6. **Prove on real size** — red arm: oversized / truncated fixture before claiming “works.”

## Do not

- Reintroduce whole-file `readFile` for dream corpus.  
- Report only `malformed` when the failure was a size ceiling.  
- Claim full Cursor coverage while BL-DRM-016 is open.

## Authority

- Lessons **L15**, **L18** — `docs/LESSONS_2026-08-09.md`  
- `docs/HONESTY.md` (streaming + `.vscdb` gap)  
- Tests: `test/digest.test.ts`  
- Prior art map: `docs/research/2026-08-09-agent-memory-prior-art.md`

## Verify

```bash
cd gotcontext-memory && npm test -- test/digest.test.ts test/dream.test.ts
```
