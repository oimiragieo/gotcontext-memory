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
