# Feature: Efficacy

**Code:** `src/dream/efficacy.ts`, `src/cli.ts` (`efficacy` command)  
**Tests:** `test/efficacy.test.ts`  
**Related:** [Dream](./dream.md) · [HONESTY](../HONESTY.md) · [Rebuild guide](../guides/rebuild-from-scratch.md)

---

## Plain English

Accepting a pattern note is a claim: “this keeps happening; remembering it should
help it stop.” **`efficacy` checks whether it actually stopped.**

It re-counts the same pattern in sessions **after** the note was accepted and
prints a verdict. It does not edit memory. It exits non-zero when something needs
a human (still happening, or a broken note).

---

## When to run it

After you have accepted one or more `memory/pattern-*.md` notes and enough new
sessions have happened (at least **5** post-acceptance sessions for a real
verdict).

```bash
gotcontext-memory dream --source all --force
gotcontext-memory review list
gotcontext-memory review accept <id> --yes
# …later, after more agent work…
gotcontext-memory efficacy --source all --max-sessions 400
```

---

## CLI

```bash
gotcontext-memory efficacy \
  [--source claude|codex|cursor|agy|opencode|all] \
  [--scope user|project] \
  [--store user|project] \
  [--max-sessions 400]
```

Stdout JSON shape:

```json
{ "notes": 1, "results": [ { "notePath": "memory/pattern-….md", "verdict": "PERSISTING", "after_k": 3, "after_n": 40, … } ] }
```

Exit **1** if any result is `PERSISTING` or `UNPARSEABLE_NOTE` (so scripts can gate).

---

## Verdicts

| Verdict | Meaning | What a junior should do |
|---|---|---|
| `RESOLVED` | Zero matches after acceptance in a thick enough window, AND the failure class was exercised enough to trust the silence (see exposure gate below) | Candidate to expire / archive the note |
| `DORMANT` | Zero matches after acceptance, but the failure class was barely exercised — "never fired" is not "fixed" | Wait for more exposure; **never** an expiry candidate |
| `PERSISTING` | Still showing up | Do **not** just re-dream it — fix with a hook, tool change, or process |
| `INSUFFICIENT_DATA` | Fewer than 5 post-acceptance sessions | Wait; thin windows never get a yes/no |
| `UNPARSEABLE_NOTE` | Frontmatter/body cannot be parsed | Repair or replace the note (often pre-`yamlScalar` damage) |

### The exposure gate (RESOLVED vs DORMANT)

Zero post-acceptance hits is two different claims wearing the same clothes: "it
worked" and "the failure class never came up." Conflating them let a note that
was simply never exercised score identically to one that was proven fixed.

`efficacy` disambiguates by projecting the note's **own claimed pre-acceptance
rate** onto the post-acceptance window: `expected = (then_k / then_n) *
after_n`. With zero post-apply hits:

- `expected >= 3` → `RESOLVED` — enough exposure to trust the silence.
- `expected < 3` → `DORMANT` — not enough exercise of the failure class to call
  it fixed.
- No baseline rate to project (the note has no `**Prevalence:**` line, or
  `then_n` is 0) → falls back to `RESOLVED` (legacy behavior — this predates the
  gate and there is nothing honest to project).

`DORMANT` NEVER becomes an expiry candidate, at any streak, and resets a
`RESOLVED` streak the same way `PERSISTING` does — it is not agreement.

### Import-outcome gating

Only notes whose landing into canonical memory is actually **on record as
landed** are scored. `review accept`/`reject` and `import` all write to an
outcome ledger (`efficacy/import-outcomes.jsonl`), keyed by
`claimKey(targetPath, body)` — the exact content, not just the path, so a
refusal on one version of a note never shadows a different, still-live version
at the same path. No record at all is **legacy behavior**: score it (this
predates the ledger, or the note was hand-written). A recorded `refused` or
`skipped` outcome for the note's exact current text excludes it silently, the
same way a note with no machine `**Pattern:**` signature is already excluded.

### Cure vs treatment: the expiry justification gate

A note can score `RESOLVED` **precisely because it is loaded every session** —
expiring it removes the treatment, and the failure returns unscored (and
un-remembered). `--propose-expiry` alone is a no-op: `expiry_recommendation`
still computes (as `RETAIN`), but nothing gets filed. Actually filing the
`expire` proposal additionally requires `--expiry-justification
mechanized|environment-changed` — an explicit human claim that either the rule
is now enforced elsewhere (a hook/gate) or the condition that caused the
failure no longer applies. Without one, `efficacy` (and the [`report`](#hitl-decision-report-report--ingest-decisions)
command) always recommends `RETAIN`. The toolkit recommends; a human still
decides — the same HITL contract as everywhere else in this package.

---

## HITL decision report (`report` / `ingest-decisions`)

`gotcontext-memory report` runs `efficacy` and writes a self-contained
`report.html`: expiry candidates (`RETAIN`/`EXPIRE`) and `DORMANT`/`PERSISTING`
notes needing attention, each with Approve/Deny/Defer. It opens from `file://`
with no server — Save writes `decisions.json` locally via
`window.showSaveFilePicker`. `gotcontext-memory ingest-decisions
[decisions.json]` applies it: approvals on an expiry item file the same
`expire` **proposal** `--propose-expiry` would (still reviewed at `review
accept`); denials record a reason (`efficacy/report-decisions.jsonl`) so the
item is never shown again; defers are no-ops. The decisions file is renamed to
`<name>.done` after processing so it can never double-fire, and file references
are **basename only** — no path traversal.

An optional `report.triageCommand` config field (a string, or an array — each
entry its own seat) can pre-triage items before they reach the human: unanimous
`APPROVE`/`DENY` across all seats auto-decides; anything else — a split, a
missing verdict line, a failed spawn — fails open to the human report. This is
a council, and it is **optional**; the human report is the default. See
[HONESTY.md](../HONESTY.md).

---

## How dating works

1. Prefer `proposals/accepted/*.json` → matching `targetPath` → `createdAt`.
2. Else fall back to the note’s frontmatter `createdAt`.
3. Only digests with `sessionTs` **after** that time count toward `after_k` / `after_n`.

Preference notes (`memory/pref-*.md`) are **not** scored — they have no machine
`**Pattern:**` signature.

Matching uses the same `signalKey` as dream. A rephrased error looks like a
**different** pattern (honest limit — not semantic merge).

---

## Rebuild checklist (tests)

```bash
npm test -- test/efficacy.test.ts
```

You should see arms for RESOLVED, DORMANT, PERSISTING, INSUFFICIENT_DATA, and
UNPARSEABLE_NOTE — plus the import-outcome exclusion in the same file.

---

## Lifecycle (2026-08-12): trends act, humans still decide

A single verdict is a data point; two agreeing runs are a **trend** the loop may
act on. Every run appends to `efficacy/history.jsonl` (operational storage —
`memoryTreeHash` is never touched by scoring), and each result carries a
`streak` counter.

| Trend | What happens | Who decides |
|---|---|---|
| `RESOLVED` ×2, ≥15 post-acceptance sessions, `--propose-expiry` + `--expiry-justification` | An `expire` **proposal** is created through the normal review flow (idempotent; notes already expiring are skipped) | **A human**, at `review accept` |
| `RESOLVED` ×2, ≥15 post-acceptance sessions, no justification | `expiry_recommendation: "RETAIN"` — nothing filed (cure vs treatment) | **A human**, via `report`/`ingest-decisions` if they want to override |
| `DORMANT` (any streak) | Never expiry-eligible; not an actionable trend by itself | Wait for more post-acceptance sessions |
| `PERSISTING` ×2 | `recommend_mechanize: true` and exit 1 — the note is not working; the fix is a mechanism (hook/gate), never a re-worded note | You. This toolkit is harness-agnostic: it says *what* needs mechanizing, it never installs anything |
| `PERSISTING` + `reads_post: 0` | `recommend_deliver: true`; `report` files it as `undelivered` | You — see below |

## Retrieval exposure: was the note ever read?

Each result carries `reads_post`: how many post-acceptance sessions actually
**opened** the note file (counted from `Read` tool calls against `memory/…` or
`MEMORY.md`). A note that keeps scoring `PERSISTING` while `reads_post` is `0`
has not failed on content — it failed on **delivery**. Nobody read it, so no
rewording can help, and escalating it to a hook skips the cheaper fix.

The remedy is to move the rule to a surface that loads without being asked for:

- the note's **index hook** — `MEMORY.md` is regenerated from each note's
  `description`, so a description that states the rule as an imperative is the
  always-loaded copy. This is an ordinary `update` proposal on the note.
- a **skill description**, if your harness loads those by default;
- a **harness gate**, once delivery is ruled out as the cause.

Because delivery outranks mechanization, an undelivered note reports as
`undelivered` rather than `persisting` in `report.html`.

**`undefined` is not `0`.** Digests captured before this field existed carry no
read telemetry at all, and those score `reads_post: undefined` — scoring them as
zero would manufacture a delivery failure out of missing instrumentation.

## Model-conditional verdicts

Digests carry the models a session ran on. Where a model has **≥5**
post-acceptance sessions, the result includes a per-model verdict
(`model_verdicts`, e.g. `{"opus": "PERSISTING 6/14", "fable": "RESOLVED 0/72"}`).
A split verdict is a **scope-narrowing finding**, not a contradiction: the note
works on one model and not another — narrow its stated scope and keep both
variants (the GEPA Pareto rule). Thinner per-model windows are never judged.

## Honesty limits (unchanged and load-bearing)

Matching is exact-`signalKey`: a rephrased failure scores as a different pattern.
Preference notes carry no machine signature and are not scored. Verdicts are
signals, not targets — optimizing FOR a verdict is the Goodhart failure the SRE
alert-quality literature warns about.
