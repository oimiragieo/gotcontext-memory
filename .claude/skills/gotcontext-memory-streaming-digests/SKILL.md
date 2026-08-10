---
name: gotcontext-memory-streaming-digests
description: >
  Use when dreaming over multi-GB transcript corpora, fixing OOM / heap pressure,
  implementing or auditing SessionDigest streaming, stratified max-sessions windows,
  concurrent digestion, distinguishing truncated from malformed reads, or Cursor
  .vscdb vs *.jsonl dream wiring in gotcontext-memory.
---

# gotcontext-memory — streaming digests

Companion to `gotcontext-memory-hitl-honesty`. Load when the problem is **scale**, not HITL policy.

## Why this exists

Measured corpus: **~9.6 GB / 11k+ Claude transcripts**, including a **~2.3 GB** file that
`readFile` rejects (`> 2 GiB`). Accumulating full `Transcript[]` cannot work. Dream must
stream into bounded digests and reason only over digests.

## Rules

1. **Stream, don’t slurp** — `digestTranscriptFile` / `digestRoots` in `src/dream/digest.ts`.
2. **Truncated ≠ malformed** — byte ceiling → `truncated: true`; parse/unreadable → `malformed`.
3. **Counts vs samples** — `DIGEST_SIGNAL_CAP` bounds arrays; counts always increment.
4. **Stratified window** — `--max-sessions` (default 400) via `selectDigests`: ≈2/3 newest +
   evenly sampled older strata (session clock). Newest-N alone collapses calendar span.
5. **Concurrent digestion** — bounded worker pool (default 8); modest I/O-bound speedup.
6. **`.vscdb` on the path** — enumerate with `*.jsonl`; `digestVscdbFile` + shared
   `classifyText` (BL-DRM-016 **closed** 2026-08-10). Unreadable `.vscdb` → malformed, not fatal.
7. **Prove on real size** — oversized / truncated fixtures before claiming “works.”

## Do not

- Reintroduce whole-file `readFile` for dream corpus.  
- Report only `malformed` when the failure was a size ceiling.  
- Re-open a silent harness drop without HONESTY + backlog.

## Authority

- Lessons **L15**, **L18**, **L22** — `docs/LESSONS_2026-08-09.md`  
- `docs/HONESTY.md`, `docs/features/dream.md`, `docs/guides/rebuild-from-scratch.md`  
- Tests: `test/digest.test.ts`, `test/digest-vscdb.test.ts`, `test/digest-window.test.ts`

## Verify

```bash
cd gotcontext-memory && npm test -- test/digest.test.ts test/digest-vscdb.test.ts test/digest-window.test.ts
```
