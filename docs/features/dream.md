# Feature: Dream

**Code:** `src/dream/digest.ts`, `src/dream/run.ts`, `src/dream/policy.ts`, `src/cli.ts`  
**Tests:** `test/dream.test.ts`, `test/digest.test.ts`, `test/digest-vscdb.test.ts`, `test/digest-window.test.ts`, `test/dream-suppression.test.ts`  
**Related:** [HITL dreaming](../concepts/hitl-dreaming.md) · [Efficacy](./efficacy.md) · [HONESTY](../HONESTY.md) · [Rebuild guide](../guides/rebuild-from-scratch.md)

---

## Plain English

`dream` reads recent agent chat logs, turns them into small **digests**, looks for
(1) “please remember…” preferences and (2) problems that show up in **many**
sessions, and writes **proposal files**. It never edits durable memory by itself.
A human runs `review accept` to promote a proposal.

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
| `--source` | `all` | Which harness log folders to scan |
| `--scope` / `--store` | user | Which store; project may filter by cwd name |
| `--force` | off | Required when `dream.enabled` is false (the install default) |
| `--max-sessions` | **400** | How many sessions **per source** enter the window after digesting |

Stdout is JSON. Important fields: `proposals`, `patterns`, `suppressedRejected`,
`truncated`, `malformed`, per-source `scanned` / `included`.

Exit **1** if dreaming is disabled without `--force`, or the kept corpus is empty
(`EMPTY_CORPUS`).

---

## Two proposal signals

Both stay **proposals only** (HITL). Neither is an LLM.

1. **Preferences** — user text matching `please remember` / `from now on`
   (not bare `always`/`prefer`; pong/ping/`/health` denied).  
   File: `memory/pref-<hash8>.md`.
2. **Prevalence** — same kind of tool error / hook block / user correction in
   **≥2 different sessions** inside the window.  
   File: `memory/pattern-<hash8>.md` with `k/n sessions` and citations.

Matching uses a normalised `signalKey` (paths/hashes/digits collapsed). Two
different wordings of the same bug can land in different buckets — that is
intentional honesty, not a bug.

---

## Digests (how we survive multi-GB logs)

We do **not** load whole transcripts into RAM.

1. Walk harness roots for `*.jsonl` **and** Cursor `*.vscdb`.
2. Stream each JSONL line-by-line into a ~1 KB `SessionDigest`.
3. Read each `.vscdb` via the Cursor SQLite reader, then run the **same**
   `classifyText` rules as JSONL (one brain, two file formats).
4. Concurrent workers (default **8**) digest many files without serial I/O waits.
5. Apply a **stratified** `--max-sessions` window (see below).
6. Extract proposals from digests only.

| Term | Meaning |
|---|---|
| `truncated` | Hit the per-file byte ceiling (32 MiB). Still a valid partial read. |
| `malformed` | Parse / unreadable failure (bad JSON line, corrupt `.vscdb`). |
| Counts vs samples | Sample arrays cap at 60; **counts keep growing**. |

`.vscdb` stores are small; they are bounded by the SQLite query, not by the JSONL
byte stream. An unreadable `.vscdb` increments `malformed` and does **not** crash dream.

---

## Stratified window (not “newest 400”)

**Problem:** On a busy machine, the newest 400 sessions can span less than a day.
A twice-weekly pain never reaches “seen in ≥2 sessions” inside that day — so
prevalence looks empty even when the bug is real.

**Fix (`selectDigests`):** keep about **2/3 newest** sessions, plus older ones
sampled evenly across older time. Sort by **session clock** (turn timestamps).
Deterministic — no randomness.

So `--max-sessions 400` means “about 400 sessions spanning recent *and* older
strata,” not “the last 400 files by mtime.”

---

## Pipeline (step by step)

1. Refuse unless `dream.enabled` or `--force`.
2. For each source: `digestRoots` → stratified digests.
3. Load current `memory/**` hashes + rejected `claimKey`s.
4. Build preference + prevalence + staleness (`expire`) proposals.
5. Skip preference targets that **already exist** (accepted / human-edited).
6. Skip rejected claims via `claimKey(targetPath, body)` (independent of `base_hash`).
7. Sort by **evidence length**, then stable path/id; apply `maxProposals`.
8. Secret-scan; write `proposals/<id>.json` only; assert `memoryTreeHash` unchanged.

Frontmatter `description` values are emitted with **YAML-safe quoting**
(`yamlScalar`) so a colon inside a signal (e.g. `eisdir: illegal…`) cannot break
the note. Pattern notes also get `createdAt` for the [efficacy](./efficacy.md) loop.

---

## claimKey vs proposalId

| | `proposalId` | `claimKey` |
|---|---|---|
| Purpose | Name the staged proposal file | Stop rejected text from coming back |
| Includes `base_hash`? | Yes (with other fields) | **No** |
| Accepted prefs | n/a | Skipped because the **path already exists** in the store |

---

## What dream will not do (v0.9)

- Call an LLM  
- Write `memory/` or `MEMORY.md`  
- Schedule itself  
- Auto-accept  
- Score whether accepted notes helped — that is `efficacy`, not `dream`

← [corpus](./corpus-importers.md) · Next → [review.md](./review.md) · [efficacy.md](./efficacy.md)
