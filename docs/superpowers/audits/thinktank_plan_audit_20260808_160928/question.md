# Thinktank: audit the gotcontext-memory implementation plan

## Mandate
You are auditing an implementation plan before coding starts. Answer inline.
Do not dispatch other agents. Do not edit files. End with:
`RECOMMENDED: APPROVE | APPROVE_WITH_FIXES | REJECT — <≤20 words>`

## Required reading (cite concrete task numbers / file paths)
1. Plan under audit:
   `/mnt/c/dev/projects/gotcontext-memory/docs/superpowers/plans/2026-08-08-gotcontext-memory-multi-harness.md`
   (Windows: `C:\dev\projects\gotcontext-memory\docs\superpowers\plans\2026-08-08-gotcontext-memory-multi-harness.md`)
2. Locked design:
   `/mnt/c/dev/projects/gotcontext-memory/docs/superpowers/specs/2026-08-08-gotcontext-memory-multi-harness-design.md`
3. Chairman synthesis (architecture C):
   `/mnt/c/dev/projects/gotcontext-memory/docs/thinktank_council_20260808_155453/CHAIRMAN_SYNTHESIS.md`
4. Prior research honesty:
   `/mnt/c/dev/projects/_dream_audit/fable-audit.md`
5. HITL contract:
   `/home/james/.claude/skills/transcript-dream-hitl/SKILL.md`

If a path is unreadable: `CANNOT_READ_REQUIRED_FILE: <path>` and continue from what you can read.

## Audit dimensions (answer each)
1. **Architecture fidelity** — Does the plan still implement locked C (disk canonical, daemon not v1 write path, HITL-only dream honesty)?
2. **Missing must-ships** — Any blocking CE/talk primitive absent (CAS, caps, secret scan, empty-corpus zero label, permission-mirrored/steering, export)?
3. **Dangerous tasks** — Any task that would auto-apply transcript memory, bypass commit(), or couple to omega?
4. **Test oracles** — Are red arms bidirectional / capable of failing? Flag any both-arms-green traps.
5. **Harness coverage honesty** — Are Claude/agy/Codex/OpenCode/Cursor adapters + corpus labels accurate?
6. **Task order** — Serial dependencies wrong? Cap ~12 respected?
7. **Junior executability** — File map + steps concrete enough?

## Output format
### Verdict
APPROVE / APPROVE_WITH_FIXES / REJECT

### Must-fix edits (numbered; empty iff APPROVE)
Each: which Task/section, what's wrong, exact replacement instruction.

### Should-fix (non-blocking)
### Confirmed strengths
### Risks if shipped as-is

Final line: `RECOMMENDED: ...`

## Plan text also copied to this run directory for seats that fail path reads:
/mnt/c/dev/projects/gotcontext-memory/docs/superpowers/audits/thinktank_plan_audit_20260808_160928/plan_under_audit.md
Windows: C:\dev\projects\gotcontext-memory\docs\superpowers\audits\thinktank_plan_audit_20260808_160928\plan_under_audit.md


---
COUNCIL INSTRUCTIONS: Answer inline. Do not dispatch other agents, use skills, or edit files. End your reply with a final line that starts with exactly: RECOMMENDED: <your one-line verdict>
