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
- **Not all of history.** Prevalence is measured over a `--max-sessions` window
  (default **400**), not the whole corpus. Since 2026-08-10 the window is
  **stratified** (`selectDigests`: two-thirds newest + evenly-sampled older strata,
  ordered by session clock, deterministic), not newest-N — newest-N silently
  collapsed in calendar time as volume grew, so a twice-weekly pattern could never
  reach a prevalence threshold on a busy machine. Unbounded remains wrong in the
  other direction: a real 17,263-session corpus produced 386 proposals with
  denominators like `16/17263` — true, meaningless, unreviewable.
- **Still no auto-supersede, still no scheduler.**

### Efficacy: accepted notes are scored, not just stored (2026-08-10)

`gotcontext-memory efficacy` closes the loop that distinguishes writing memory from
learning. Each accepted pattern-note implicitly claims "remember this and it should
stop happening"; efficacy re-counts that pattern over sessions AFTER acceptance
(dated from the accepted-proposal archive, falling back to frontmatter `createdAt`)
and renders: **RESOLVED** (zero recurrences in a sufficient window — expiry
candidate), **PERSISTING** (still recurring — escalate to a hook/mechanism, do not
re-remember; exits non-zero so automation can gate), **INSUFFICIENT_DATA** (fewer
than 5 post-acceptance sessions — a thin window yields no verdict, ever), or
**UNPARSEABLE_NOTE** (a damaged note is a finding, never a silent skip). Honesty
limits: matching is by exact `signalKey`, so a rephrased failure scores as a
different pattern; preference notes carry no machine signature and are not scored.

Related fix, same date: note frontmatter is now emitted with a YAML-quoted
`description` (`yamlScalar`). Previously an ordinary colon inside a signal key
("eisdir: illegal operation…") produced a note whose frontmatter failed to parse —
breaking the staleness sweep and anything else reading it.

### Lifecycle + usage (2026-08-12) — trends act, humans still decide

- **Streaks.** Efficacy verdicts are history-backed (`efficacy/history.jsonl`,
  operational storage — `memoryTreeHash` untouched): one run is a data point, two
  agreeing runs are a trend.
- **Retire:** RESOLVED on ≥2 consecutive runs with ≥15 post-acceptance sessions and
  `--propose-expiry` emits an `expire` PROPOSAL through the normal review flow —
  idempotent (no duplicate proposals; notes already carrying `expires` are skipped),
  and canonical memory is never touched by scoring. **A human still accepts.**
- **Escalate:** PERSISTING on ≥2 consecutive runs sets `recommend_mechanize` and the
  command exits non-zero. This toolkit is harness-agnostic: it SAYS "this needs a
  mechanism", it never installs hooks or edits harness config.
- **Model-conditional verdicts:** per-model RESOLVED/PERSISTING where that model has
  ≥5 post-acceptance sessions; thinner windows are never judged. A split verdict is a
  scope-narrowing finding, not a contradiction — keep both variants.
- **`usage`:** skill-usage telemetry DERIVED from digests (portable across every
  ingested harness), with an optional `--skills-dir` registry denominator.
  REPORT-ONLY — never archives, deletes, or edits a skill. The never-used grace
  floor (dir younger than 14 days = `too-new-to-judge`) means a mass pack install
  reports honestly: "0 never-used" beside a large too-new bucket is NOT evidence
  everything is used, and the summary carries both numbers so nobody misreads it.
- **Not ported, by design:** council-seat calibration (this package has no council —
  the human is the reviewer) and hook installation (harness-specific).

### Exposure gate, cure-vs-treatment, import-outcome gating, HITL report (2026-08-13)

Ported from the private engine's this-week upgrades (8-seat cross-model council
validated), harness-agnostic subset only — the parts that are pure scoring,
proposal, and human-decision logic, none of the harness-specific installation.

- **`DORMANT` verdict (the exposure gate).** Zero post-acceptance hits used to
  score `RESOLVED` unconditionally — conflating "it worked" with "the failure
  class never came up." `efficacy` now projects the note's own claimed
  pre-acceptance rate onto the post-acceptance window (`expected = (then_k /
  then_n) * after_n`); below an expected count of 3, zero hits is `DORMANT`, not
  `RESOLVED`. `DORMANT` is never expiry-eligible and resets a `RESOLVED` streak
  the same way `PERSISTING` does. No baseline rate to project falls back to the
  old `RESOLVED` behavior — an honest limit, not a silent regression.
- **Cure vs treatment.** A note can score `RESOLVED` precisely because it is
  loaded into every session; expiring it removes the treatment and the failure
  returns unscored. `--propose-expiry` now requires an explicit
  `--expiry-justification mechanized|environment-changed`; without one,
  `efficacy` recommends `RETAIN` and files nothing. Still HITL: the toolkit
  recommends, a human decides — via `review accept` on the filed proposal, or
  via `report`/`ingest-decisions` overriding a `RETAIN` recommendation.
- **Import-outcome gating.** `efficacy` scores a note only if its landing into
  canonical memory is on record as `landed` (`efficacy/import-outcomes.jsonl`,
  keyed by `claimKey(targetPath, body)` — content-addressed, so a refusal on one
  version of a note never shadows a different, still-live version at the same
  path). `review accept`/`reject` and `import` all write to this ledger; no
  record at all is legacy behavior (score it, same as before this ledger
  existed).
- **HITL decision report (`report` / `ingest-decisions`).** `report` writes a
  self-contained `report.html` (dark palette, WCAG-AA-measured contrast,
  `file://`-only, no network) covering expiry candidates and `DORMANT`/
  `PERSISTING` notes needing attention; a human Approves/Denies/Defers per item
  in the browser and saves `decisions.json` via `window.showSaveFilePicker`.
  `ingest-decisions` applies it — approvals on an expiry item file the exact
  same `expire` PROPOSAL the propose→review flow already uses (still reviewed
  at `review accept`); denials record a reason so the item is never
  re-proposed. The decisions file is renamed to `<name>.done` after every
  decision lands (never double-fires) and must be a **basename only** (path
  traversal refused). An optional `report.triageCommand` config field (a
  string, or an array of commands — each its own seat) can pre-triage items:
  unanimous `APPROVE`/`DENY` auto-decides; anything else — a split, a missing
  verdict line, a spawn failure — **fails open to the human report**. Council is
  optional; the human report is the default, and this remains true regardless
  of what the private engine's council calibration does — that calibration
  itself was explicitly NOT ported (see above).

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
| Claude Code | CLAUDE.md managed block | Full — Claude JSONL on the digest path (incl. Skill tool_use when present) |
| Codex | AGENTS.md managed block | Full turns — REAL rollout shape (`response_item`/`payload.message`) on the digest path since 2026-08-12; before that, codex sessions digested as EMPTY SHELLS (scanned+included, zero signal). developer/system turns excluded (injected instructions are not user signal). Tool/skill metadata not yet parsed |
| Cursor | `.cursor/rules/*.mdc` | JSONL **and** `.vscdb` on the digest dream path (BL-DRM-016 closed 2026-08-10); tool/skill metadata partial |
| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood (no agy corpus existed on the reference machine to pin against) |
| OpenCode | AGENTS.md managed block | **SQLite db on the digest path since 2026-08-12** (`digestOpencodeDb`: read-only, newest-N by session clock, shared classifier; session/message/part schema; dogfooded against a real 10.1 GB db — 293 sessions digested). The JSONL roots remain configured but have never existed in the wild |

One classifier (`classifyText`) scores every source — a session is judged by the same
rules whether it arrived as Claude JSONL, a codex rollout, a Cursor `.vscdb`, or an
OpenCode SQLite row. Adding a new CLI = one adapter that yields (role, text, clock)
into that classifier; nothing downstream changes.

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
