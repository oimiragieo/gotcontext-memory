# Thinktank: RE-AUDIT round 3 — gotcontext-memory plan

## Mandate
Verify Round-2 must-fixes landed. Answer inline. No agents. No edits.
End: `RECOMMENDED: APPROVE | APPROVE_WITH_FIXES | REJECT — <≤20 words>`

**Default to APPROVE** if all checklist items are PRESENT with Task citations.
Only APPROVE_WITH_FIXES for a *new* blocking contradiction, not nitpicks.

## Round-2 checklist (mark PRESENT/ABSENT + cite)
1. Store-owned `commitCanonical` / `commitOperational` / `deleteCanonical`; AST guard = module allowlist `store.ts` (+ installer non-store)
2. Accept preflight (index cap) before target commit; proposal accepted only after canonical commits complete
3. Deterministic content-hash proposal ids; createdAt exempt from idempotency
4. Cross-process lock via pinned `proper-lockfile`; two **child processes** in CAS test
5. Path containment tests (traversal/absolute/symlink)
6. Fixture-pinned importer formats (not “read this machine”)
7. Commit journal for new-file history
8. Round-1 items still present (memoryTreeHash, CE-8, expire/delete, proposal secret scan, deny-by-default secrets)

## Authority
Full plan text follows in this same message after the separator.

---
