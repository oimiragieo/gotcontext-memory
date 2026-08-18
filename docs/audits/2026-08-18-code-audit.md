# Code Audit — gotcontext-memory (public toolkit), 2026-08-18

Standard applied (same audit as the private engine, `gotcontext-memory-private`
`docs/audits/2026-08-18-code-audit.md`): data contracts ≤ 500 lines/file, core logic
≤ 1,000 lines/file, tests and fixtures ≤ 2,000 lines/file, lint/format clean, full
suite green, findings evidence-based.

## Verdict: Pass

No remediation was required. This is recorded so the pass is evidenced, not asserted.

## File-size validation (all authored files; none within 10% of a limit)

| File | Category | Lines | Limit | Status |
|---|---|---|---|---|
| src/report.ts | core | 590 | 1,000 | PASS |
| src/cli.ts | entry/core | 545 | 1,000 | PASS |
| src/dream/digest.ts | core | 538 | 1,000 | PASS |
| src/dream/run.ts | core | 450 | 1,000 | PASS |
| src/dream/efficacy.ts | core | 427 | 1,000 | PASS |
| src/store.ts | core | 395 | 1,000 | PASS |
| (all remaining src) | core | ≤ 369 | 1,000 | PASS |
| test/efficacy.test.ts (largest) | test | 277 | 2,000 | PASS |

Contracts here are TypeScript types co-located with their modules (`Proposal` in
`src/dream/run.ts`, `SessionDigest` in `src/dream/digest.ts`, frontmatter in
`src/frontmatter.ts` at 24 lines) — no contract file approaches 500 lines.
Excluded: `docker/`, lockfiles, `dist/` (generated), `docs/` (prose).

## Quality gates (run this audit, 2026-08-18)

- `npm run lint` (biome check): 64 files, no fixes applied.
- `npx biome format .`: no fixes applied.
- `npm run build` (tsc): clean.
- `npx vitest run`: 26 files, 161 tests, all pass.

## Why this repo passes where the private engine initially failed

The TypeScript toolkit was module-per-subsystem from the start (`store` / `review` /
`report` / `dream/{digest,run,efficacy}` / `corpus/*` adapters), so no file ever
concentrated the way the Python engine's 2,882-line `dream.py` did. The private
engine now mirrors this shape (`dreamlib/`); the two codebases are structurally
aligned as of this date.

## Open items (tracked in BACKLOG.md, unchanged by this audit)

BL-DRM-002 (semantic merge), BL-DRM-022 (consolidation tier), BL-DRM-023
(escalation dedup), BL-DRM-025 (evidence projects on proposals + user-tier
disclosure gating), plus sections D–I. None is a size, lint, test, or
documentation-completeness violation; all are feature backlog.

## Addendum: shipped-artifact dogfood (same day)

In-process tests are not proof the shipped CLI works, so the real binary
(`dist/cli.js`, invoked as a user would) was run end-to-end on this machine's
live corpus:

| Step | Command | Result |
|---|---|---|
| init | `init` / `init --project` | managed blocks written (CLAUDE.md, cursor rules); no clobber |
| dream | `dream --source all --store user --force` | **15,547 sessions** (claude 8,379 + codex 6,460 + cursor 308 + opencode-db 400) in **95 s**; **65 proposals**, all evidence-cited with counted prevalence and real session ids |
| review | `review list` / `review accept <id> --yes` | accept committed via CAS; proposal moved to accepted/ |
| efficacy | `efficacy --source all` | fresh note scored `INSUFFICIENT_DATA` (correct — no post-window yet), `reads_post` present |
| report | `report --out report.html` | 7.6 KB HTML, renders |
| doctor | `doctor` | all checks pass |
| export | `export --out …` | archive produced |

Two UX defects found by dogfooding and fixed same-commit:

1. `dream --store project` from a directory with no matching sessions excluded
   all 8,379 transcripts and said only `EMPTY_CORPUS … excluded_permission=8379`
   — a first-run dead end. The message now explains project scoping and names
   the fix (`--store user`, or run from the owning project directory).
2. `--source all` printed `opencode: EMPTY` beside `opencode-db: OK (400)` —
   the legacy JSONL roots are empty on every real install, and the row read as
   a broken source. It is now labeled SKIPPED with the reason.
