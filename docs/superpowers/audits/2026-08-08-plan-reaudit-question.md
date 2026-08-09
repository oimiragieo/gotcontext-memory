# Thinktank: RE-AUDIT patched gotcontext-memory plan (round 2)

## Mandate
Re-audit after Round-1 APPROVE_WITH_FIXES were applied. Answer inline. Do not
dispatch agents. Do not edit files. End with:
`RECOMMENDED: APPROVE | APPROVE_WITH_FIXES | REJECT — <≤20 words>`

Prefer **APPROVE** only if Round-1 must-fixes are actually present in the plan text
(cite Task numbers). If any Round-1 blocking item is still missing → APPROVE_WITH_FIXES
or REJECT.

## Round-1 must-fixes checklist (verify each PRESENT or ABSENT)
1. `memoryTreeHash` defined vs whole-store; proposals excluded; controls both ways
2. Two-concurrent-writer CAS lock + test
3. CE-8 permission-mirrored corpus + reconcile counts
4. Proposal actions `expire|delete` + staleness oracle; delete two-step
5. Proposal-time secret scan before writing proposals
6. Corpus `tool_events` / `skill_invocations`
7. `regenerateIndex` pure; persist only via `commit()`
8. Task 2 secret gate remains deny-by-default (Do NOT contradiction fixed)
9. Task 7 accept uses explicit path sets (not “exactly one file”)
10. `memory.policy` rendered into all five adapter fragments (Task 12 oracle)

## Required reading
- Plan: `/mnt/c/dev/projects/gotcontext-memory/docs/superpowers/plans/2026-08-08-gotcontext-memory-multi-harness.md`
  (also copied beside this question as `plan_under_audit.md`)
- Round-1 chairman: `/mnt/c/dev/projects/gotcontext-memory/docs/superpowers/audits/thinktank_plan_audit_20260808_160928/CHAIRMAN_ROUND1.md`
- Design: `/mnt/c/dev/projects/gotcontext-memory/docs/superpowers/specs/2026-08-08-gotcontext-memory-multi-harness-design.md`

## Output
### Checklist table (10 rows: PRESENT / ABSENT + citation)
### Verdict
### Must-fix (empty iff APPROVE)
### Residual should-fix
Final line: `RECOMMENDED: ...`
