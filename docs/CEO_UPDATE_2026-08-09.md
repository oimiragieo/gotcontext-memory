# CEO update — gotcontext-memory (2026-08-09)

Plain English. No jargon required.

## Bottom line

We audited the package hard, **fixed the dangerous bugs**, landed **streaming digests + stratified prevalence + efficacy**, and keep tests green (**105+**). Tip of main includes `beda78e` era work. It is still **0.9.0** — not “done / 1.0” until you say ship. It is **not** the same as JARVIS/omega LLM dream (that one uses an LLM).

---

## What worked

1. **Deep-dive found real bugs** prior “all clear” audits missed (lock split, accept race, fake symlink test, MCP could rewrite memory without your OK).
2. **We fixed the critical/high set** and re-checked: tests, lint, TypeScript build all green (**85** tests).
3. **Honesty stayed honest:** dreaming still only writes *proposals*; you still have to accept. MCP direct commit is now **off unless you flip a flag** (`mcp.allowCommit: false`).
4. **Preference spam filter:** bare “always/prefer” and health-check “pong” text no longer become proposals.
5. **Docker dogfood** still works if you pass `--force` when `dream.enabled` is false (default).
6. **Repo is public MIT** with CI on three OSes (from earlier work this weekend).
7. **Digest / prevalence / efficacy on main:** streams multi-GB corpora; Cursor `.vscdb` on digest path; stratified `--max-sessions`; `efficacy` scores accepted pattern notes.

---

## What did *not* work / watch-outs

- Live PC **transcript dream** ran overnight but staged **only** `"respond with exactly: pong"` — pipeline alive, quality bad; **nothing accepted**.
- PC **memory_dream** (auto consolidator) **did not run** (last run ~Jul 23).
- Thinktank `tt_quick` **infra failed** this session; we used a 3-agent fallback instead. Seats themselves smoke-tested OK.
- **Exa** was not available (no MCP / no API key) — used web search for competitor/security freshness.
- **Cursor `.vscdb`:** was a temporary gap after the OOM digest work; **closed 2026-08-10** (JSONL + `.vscdb` on the same dream path).

---

## Full backlog

Canonical list: [`docs/BACKLOG.md`](./BACKLOG.md). Summary buckets:

| Bucket | Examples |
|---|---|
| **Ship / release** | CEO go for `1.0.0`; reconcile stale plan checkboxes |
| **Dream quality** | LLM reviewer parity with omega; richer lenses; filter health transcripts at PC omega; efficacy already shipped |
| **Corpus** | Real agy + OpenCode parsers (still PARTIAL stubs) |
| **Portability / install** | Export installer-manifest; proposal round-trip; uninstall harden |
| **Security follow-ups** | Import allowlist trust; gunzip size caps; path TOCTOU/symlink harden |
| **Doctor / MCP / tests** | Live corpus scans in doctor; full MCP SDK; coverage thresholds; Docker in CI |
| **Product tiers** | Merged project+user memory view; optional queue-only daemon (v1.1+) |

---

## Needs research (don’t build yet)

1. **How close should gotcontext get to omega `transcript_dream`?** LLM reviewer + prevalence + manifests vs stay regex+HITL.
2. **PC dream “pong” root cause** — corpus pollution vs reviewer prompt vs selection filter (omega side).
3. **Why `memory_dream` idle hook is stale** on the PC stack.
4. **Exa wiring in Cursor** — restore MCP or `EXA_API_KEY` for competitive refreshes.
5. **Whether `mcp.allowCommit` should ever be on by default** in any harness profile (today: no).
6. **Mem0 / Zep / Letta dream patterns** — what to copy (HITL diff, triage gates) without dragging cloud APIs into v1.

---

## Lessons learned (5+)

Full write-up: [`docs/LESSONS_2026-08-09.md`](./LESSONS_2026-08-09.md) (L1–L20). Short list:

1. **Green tests can be fake** — missing `import` + catch-all skip = “symlink safe” lie.
2. **A check that never fails is not a check** — doctor `index_caps` always said pass.
3. **Lock the same key for create and delete** — stub vs file path = race.
4. **Rebuild shared indexes under the lock** — stale snapshot overwrites the winner.
5. **HITL honesty dies if MCP can commit** — propose-only must be the default.
6. **Prior “PASS” audits can miss HIGH** — re-open with fresh lenses + concurrent oracles.
7. **“Dream worked” ≠ “dream was useful”** — PC overnight = pong spam.
8. **Sequential TDD oracles can miss concurrency bugs** — need overlapping accepts.
9. **Thinktank smoke ≠ thinktank workload** — have a Claude-lens fallback ready.
10. **gotcontext ≠ omega dream** — never sell regex package as live LLM dream.
11. **Real corpus scale needs digests** — truncated ≠ malformed (L15).
12. **Rejected claims must stay dead** — `claimKey` independent of `base_hash` (L16).
13. **Unbounded prevalence is useless** — window with `--max-sessions` (L17).
14. **Closing OOM can drop `.vscdb`** — document + track BL-DRM-016 (L18).

Retained in: this doc, `BACKLOG.md`, `LESSONS_*.md`, `AGENTS.md`, Cursor rule, skills under [SKILLS.md](./SKILLS.md), omega `MEMORY.md` index.

---

## Addendum — digest / prevalence (**MERGED** `6ecf0c9`)

**Status:** on **main** as `6ecf0c9` (was branch tip `2676a6c` / `feat/digest-prevalence-parity`). **Tests:** **85 green** (verified). Merge hygiene items (tensor-grep gitignore, untangle) closed — see BACKLOG BL-MRG-*.

### What this adds (in plain English)

1. **It can finally read a real history** — streams transcripts into tiny (~1 KB) digests instead of loading multi-GB files into RAM.
2. **Rejected advice stays rejected** — and accepted prefs aren’t silently overwritten by the regex on the next run (`claimKey`).
3. **It can surface recurring pain** — same class of “this error keeps showing up across sessions” findings our live system was good at (still counted by text pattern, not an LLM), windowed by `--max-sessions` (default 400).

### Three CEO decisions (resolved / tracked)

1. **Untangle before merge?** Done for main land; tensor-grep caches gitignored.
2. **Accept `.vscdb` gap until 1.0?** **Closed 2026-08-10** — Cursor `.vscdb` is on the digest path again (BL-DRM-016).
3. **Parity wording:** HITL + regex prefs + **stratified** windowed prevalence — still not LLM / not all-history.

---

## Addendum — efficacy + stratified window + YAML-safe notes (2026-08-10)

**Status:** on main (`b9e5158` / `beda78e`). **Tests:** 105+ green.

### Plain English

1. **Efficacy** — after you accept a pattern note, `gotcontext-memory efficacy` asks “did it stop?” (`RESOLVED` / `PERSISTING` / `INSUFFICIENT_DATA` / `UNPARSEABLE_NOTE`). It does not auto-delete notes.
2. **Stratified window** — `--max-sessions` is no longer “newest N only” (that collapsed to under a day on busy machines). It keeps recent sessions **and** samples older ones.
3. **Faster digests** — concurrent workers (default 8); modest I/O-bound speedup.
4. **Safer notes** — YAML-quoted frontmatter so colons in error text cannot break the file.

Junior rebuild path: [`guides/rebuild-from-scratch.md`](./guides/rebuild-from-scratch.md).
