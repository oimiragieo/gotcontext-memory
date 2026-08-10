# Honesty

**Related:** [Documentation hub](./README.md) · [START-HERE](./START-HERE.md) ·
[Harness matrix](./adapters/harness-matrix.md)

## What this package claims

- **Dreaming** = scan permission-scoped transcripts → write **proposals only** →
  human `review accept|reject`. Canonical memory changes only on accept through
  `MemoryStore.commitCanonical` / `deleteCanonical` (CAS + secret scan + MEMORY.md caps).
- Parity target: omega / house **transcript_dream HITL** loop only.
- We do **not** claim parity with omega-orchestrator `memory_dream` auto-supersede.
- Fresh install never dreams unprompted (`dream.enabled` default false; CLI `dream`
  refuses unless `--force` or `dream.enabled` true; no scheduler in v1).
- MCP `memory_commit` is **default-off** (`mcp.allowCommit: false`). Agents use
  `memory_propose` → human `review accept`. Opt-in commit is a conscious non-HITL mode.
- Version is **0.9.0** until CEO publish gate + CI matrix green on a clean checkout for `1.0.0`.

## Dreaming: what the two signals are (updated 2026-08-09)

Dreaming now emits proposals from **two** signals. Both are still proposals-only and
still HITL — nothing below changes the never-auto-apply rule.

1. **Explicit preferences** — regex anchored on `please remember` / `from now on`.
2. **Cross-session prevalence** — recurring tool errors, hook blocks and user
   corrections, reported as `k/n sessions` with cited session ids and line numbers.

What this is **not**:

- **Not an LLM brain.** Patterns are clustered by normalised string key
  (`signalKey`), not by meaning. Two phrasings of the same underlying problem land in
  different buckets. Prevalence is *counted*, never inferred.
- **Not all of history.** Prevalence is measured over the newest `--max-sessions`
  per source (default **400**), not the whole corpus. The denominator in a proposal is
  that window. Unbounded, a real 17,263-session corpus produced 386 proposals with
  denominators like `16/17263` — technically true, practically meaningless, and far
  more than a human will review.
- **Still no auto-supersede, still no scheduler.**

### Corpus reading is streamed and bounded

Transcripts are streamed line-by-line into ~1 KB digests; whole transcripts are never
held in memory. This is load-bearing, not an optimisation: measured on a real
workstation the corpus was **9.6 GB / 11,683 Claude transcripts**, including a single
**2.3 GB** file that `readFile` rejects outright (`File size … is greater than 2 GiB`).
A full `dream` over 17,264 sessions completes under a **512 MB** heap.

- Per-file reads stop at a byte ceiling and are reported as **`truncated`**, counted
  separately from **`malformed`**. A size limit is a bounded read, not corruption, and
  conflating the two hides an OOM-class event behind a parse-error count.
- **Closed 2026-08-10 (BL-DRM-016).** The digest path now enumerates `*.vscdb`
  alongside `*.jsonl` and digests Cursor's read-only SQLite store via
  `digestVscdbFile`. Both paths share one `classifyText`, so a Cursor session is
  scored by exactly the same rules as a Claude one. `.vscdb` is bounded by its query
  rather than streamed — these stores are small, unlike the multi-GB JSONL
  transcripts — and an unreadable `.vscdb` is counted as `malformed`, never fatal.

## Adapter / corpus matrix

| Harness | Install fragment | Corpus importer |
|---|---|---|
| Claude Code | CLAUDE.md managed block | Full — fixture-pinned Claude JSONL (incl. Skill tool_use when present) |
| Codex | AGENTS.md managed block | Full turns — fixture-pinned Codex JSONL; tool/skill metadata often empty in fixtures |
| Cursor | `.cursor/rules/*.mdc` | JSONL **and** `.vscdb` on the digest dream path (BL-DRM-016 closed 2026-08-10); tool/skill metadata partial |
| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
| OpenCode | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |

## Caps & CAS

- MEMORY.md hard caps: ~200 lines / 25KB — reject, never auto-truncate.
- `memoryTreeHash` covers `memory/**` + `MEMORY.md` only (not proposals/revisions/receipts).
- Human edits outside the CLI are allowed; the **caller** must supply `baseHash` equal to
  current on-disk bytes (or `absent`). There is no silent reconciliation workflow in v1 —
  `doctor` reports dangling index entries and `receipts/*.error.json` accept failures, which now name the CAUSE (CAS_CONFLICT / SECRET_DETECTED / INDEX_CAP / TARGET_MISSING / INVALID_PROPOSAL / PROPOSAL_EXPIRED / PATH_VIOLATION / INTERNAL_ERROR — the old `INDEX_DRIFT_OR_CAS` catch-all is gone);
  `commitCanonical` refuses stale CAS.

## Uninstall

- `gotcontext-memory uninstall` restores each touched adapter file from the
  installer manifest `preImageBase64` (byte-faithful) when a pre-image existed;
  files created solely by install strip the managed block.

## Scope / permission note

- Project filtering uses parent-directory basename (`projectKey`) against fixture roots
  and CLI-supplied roots. This is **fixture-level / partial path identity**, not a
  full harness workspace ACL. Do not read “permission-scoped” as OS permission enforcement.

---

← [Hub](./README.md) · [Security model](./architecture/security-model.md)
