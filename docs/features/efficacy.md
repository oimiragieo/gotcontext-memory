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
| `RESOLVED` | Zero matches after acceptance in a thick enough window | Candidate to expire / archive the note |
| `PERSISTING` | Still showing up | Do **not** just re-dream it — fix with a hook, tool change, or process |
| `INSUFFICIENT_DATA` | Fewer than 5 post-acceptance sessions | Wait; thin windows never get a yes/no |
| `UNPARSEABLE_NOTE` | Frontmatter/body cannot be parsed | Repair or replace the note (often pre-`yamlScalar` damage) |

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

You should see arms for RESOLVED, PERSISTING, INSUFFICIENT_DATA, and UNPARSEABLE_NOTE.

---

## Lifecycle (2026-08-12): trends act, humans still decide

A single verdict is a data point; two agreeing runs are a **trend** the loop may
act on. Every run appends to `efficacy/history.jsonl` (operational storage —
`memoryTreeHash` is never touched by scoring), and each result carries a
`streak` counter.

| Trend | What happens | Who decides |
|---|---|---|
| `RESOLVED` ×2, ≥15 post-acceptance sessions, `--propose-expiry` | An `expire` **proposal** is created through the normal review flow (idempotent; notes already expiring are skipped) | **A human**, at `review accept` |
| `PERSISTING` ×2 | `recommend_mechanize: true` and exit 1 — the note is not working; the fix is a mechanism (hook/gate), never a re-worded note | You. This toolkit is harness-agnostic: it says *what* needs mechanizing, it never installs anything |

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
