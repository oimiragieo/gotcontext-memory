# Feature: Dream

**Code:** `src/dream/digest.ts`, `src/dream/run.ts`, `src/dream/policy.ts`, `src/cli.ts`  
**Tests:** `test/dream.test.ts`  
**Concept:** [HITL dreaming](../concepts/hitl-dreaming.md) · [HONESTY](../HONESTY.md)

---

## CLI

```bash
gotcontext-memory dream --source claude|codex|cursor|agy|opencode|all \
  --store user|project \
  --scope user|project \
  --force \
  --max-sessions 400
```

| Flag | Default | Meaning |
|---|---|---|
| `--source` | `all` | Which harness corpora to digest |
| `--scope` / `--store` | user (unless project store present) | Store tier + optional `projectKey` filter |
| `--force` | off | Required when `dream.enabled` is false (the install default) |
| `--max-sessions` | **400** | Newest sessions **per source** kept after digest (bounds heap **and** keeps prevalence denominators meaningful) |

Stdout JSON includes:

`proposals`, `patterns`, `withheldSecrets`, `dropped`, `suppressedRejected`, `truncated`, `scanned`, `included`, `excluded_permission`, `sources: [{name,label,scanned,included,malformed,truncated}]`.

On empty kept corpus: stderr `EMPTY_CORPUS — …` and exit code 1.

---

## Two proposal signals (v0.9)

Dreaming emits proposals from **two** signals. Both stay proposals-only / HITL.

1. **Explicit preferences** — user/human text matching `please remember` / `from now on` (not bare `always`/`prefer`; health/pong/ping spans denied). Target: `memory/pref-<hash8>.md`.
2. **Windowed prevalence** — recurring `tool_error` / `hook_block` / `user_correction` patterns across **≥2 distinct sessions** in the `--max-sessions` window. Target: `memory/pattern-<hash8>.md` with `k/n sessions`, occurrence count, session ids, and cited lines.

Prevalence is **counted** via normalised `signalKey` (paths/hashes/digits collapsed) — not an LLM, not semantic merge.

---

## Digests (streaming substrate)

CLI dream does **not** load full `Transcript[]` into memory. It streams each `*.jsonl` into a ~**1 KB** `SessionDigest` (`digestTranscriptFile` / `digestRoots`):

- Line-by-line read; peak memory ≈ one line + the digest array
- Per-file byte ceiling (`DIGEST_MAX_BYTES` = 32 MiB): stop reading, set `truncated: true`, **keep counts already seen**
- **`truncated` ≠ `malformed`** — size ceiling is a bounded read; JSON parse failures increment `malformed`
- Sample arrays capped (`DIGEST_SIGNAL_CAP` = 60); **counts are never capped**
- Digests sorted by **session clock** (turn timestamps; mtime fallback), then sliced to `--max-sessions`

Library path `runDream(store, transcripts, …)` still exists for fixtures/tests; production CLI uses `runDreamFromDigests`.

**Known gap (BL-DRM-016):** digest enumeration is `*.jsonl` only → Cursor `.vscdb` is **not** consulted by CLI `dream` (still implemented in `cursorCorpus` for tests/tools). See [corpus-importers](./corpus-importers.md).

---

## Pipeline (CLI / digest path)

1. Gate on `dream.enabled` unless `--force`
2. For each selected source: `digestRoots({ roots: defaultCorpusRoots(name), maxSessions, projectKey? })`
3. `runDreamFromDigests(store, digests, counts)`
4. Load `memory/**/*.md` hashes + **suppressed claim set** from `proposals/rejected/*.json`
5. Extract preference proposals from digests; mine prevalence (`minSessions: 2`); skip preference-kind patterns (prefs already handled)
6. Skip targets that already exist (accepted / human-edited memory stays put)
7. Suppress by **`claimKey(targetPath, body)`** — independent of `base_hash` so rejects stay dead and ids don’t resurrect under a new hash
8. Sort by **evidence strength** (then stable path/id); apply `maxProposals`
9. Secret-scan + `commitOperational(proposals/<id>.json)`; assert `memoryTreeHash` unchanged

---

## claimKey suppression

`claimKey` = `targetPath::sha256(body)[0:16]`.

Without it, deterministic extraction re-emits byte-identical rejected claims forever, and a new `base_hash` after accept would let the same claim return under a new `proposalId`. Rejected archives feed `loadSuppressedClaims`; accepted prefs are skipped because the target already exists in store hashes.

`suppressedRejected` in CLI JSON counts claims skipped this way.

---

## Proposal id stability

`proposalId` hashes: `action`, `targetPath`, `base_hash`, `body`, evidence quotes.  
`createdAt` / `expiresAt` are **not** part of the id material.  
Do **not** use `proposalId` for resurrection suppression — use `claimKey`.

---

## What dream will not do (v0.9)

- Call an LLM
- Write `memory/` or `MEMORY.md`
- Schedule itself
- Auto-accept
- Dream over unbounded history (windowed by `--max-sessions`)
- Read Cursor `.vscdb` on the digest path (gap until BL-DRM-016)

← [corpus](./corpus-importers.md) · Next → [review.md](./review.md)
