# Chairman synthesis — plan audit round 1

**Council:** thinktank_plan_audit_20260808_160928 · 6/8 verdict seats  
**Matrix:** 5× APPROVE_WITH_FIXES · 1× APPROVE (agy) · droid_glm TIMEOUT · cursor MISSING_CLI

## Spine
Claude + Codex must-fix lists (highest evidence; cite CE-8 / hash-scope / concurrency).

## Must-fixes applied to plan (blocking)
1. Define `memoryTreeHash()` vs whole-store hash; exclude proposals/receipts/locks/temps.
2. Two-concurrent-writer CAS serialization + test (exactly one wins).
3. Permission-mirrored corpus (CE-8) with included/excluded/scanned reconcile.
4. Proposal actions include `expire|delete` + staleness oracle; delete is two-step.
5. Proposal-time secret scan before writing proposal files.
6. Corpus skill-invocation (+ tool) metadata fields.
7. `regenerateIndex` pure; callers commit via `MemoryStore.commit()`.
8. Fix Task 2 Do NOT contradiction (gate stays deny-by-default).
9. Task 7 accept assertions use explicit path sets (canonical vs operational), not “exactly one file”.
10. Adapter fragments render `memory.policy` steering (in-band + dream), Task 12 oracle.

## Non-blocking folded if cheap
- Human-edit reconciliation note in HONESTY.md
- Pin MCP SDK / CI tools to lockfile
- Non-code memory fixture

## Next
Re-audit after plan patch → require APPROVE (or APPROVE_WITH_FIXES with empty must-fix after second fix pass).
