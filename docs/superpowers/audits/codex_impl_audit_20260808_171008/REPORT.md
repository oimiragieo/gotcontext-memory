# Codex re-audit round 5

## Round 5 verdict

No CRITICAL or HIGH blocking defect was found. The three prior HIGH blockers remain closed, and the six claimed round-5 fixes are present in source.

### Tasks 1–12

1. **PASS core** — CAS, locks, revisions, journal, containment, and sole-writer APIs remain intact. The AST guard still broadly exempts installer/portability ([test/guards.test.ts:27](C:/dev/projects/gotcontext-memory/test/guards.test.ts:27)).
2. **PASS** — Deny-by-default secret scanning remains enforced.
3. **PASS** — `regenerateIndex` now supports deterministic expiry filtering through `nowMs` ([src/index.ts:12](C:/dev/projects/gotcontext-memory/src/index.ts:12)).
4. **PARTIAL, non-blocking** — Explicit tiers/default-off behavior exist; merged project/user reads with entry provenance remain incomplete.
5. **PASS core** — Three primary importers plus honest PARTIAL labels for agy/OpenCode. Codex/Cursor metadata limitations are now disclosed accurately.
6. **PASS core** — Proposal-only dreaming, hash invariance, focus filtering, and combined policy/cap drop accounting are implemented ([src/dream/policy.ts:22](C:/dev/projects/gotcontext-memory/src/dream/policy.ts:22), [src/dream/run.ts:167](C:/dev/projects/gotcontext-memory/src/dream/run.ts:167)).
7. **PASS** — `review show` is wired with proposal-ID validation ([src/cli.ts:182](C:/dev/projects/gotcontext-memory/src/cli.ts:182)).
8. **PASS core** — Five adapters and reversible installation remain present. Automatic MCP registration remains outside the implemented subset.
9. **PARTIAL, non-blocking** — Doctor still lacks full revision consistency, adapter-state, and measured corpus checks.
10. **PASS core** — Replace deletes absent canonical memories, imports proposals, and writes a receipt ([src/portability.ts:76](C:/dev/projects/gotcontext-memory/src/portability.ts:76), [src/portability.ts:131](C:/dev/projects/gotcontext-memory/src/portability.ts:131), [src/portability.ts:164](C:/dev/projects/gotcontext-memory/src/portability.ts:164)).
11. **PARTIAL, honest** — Commit-mediated JSON-RPC tools exist, but full MCP SDK conformance/registration is not claimed.
12. **PASS core** — Focus, cap-drop reporting, truthful documentation, version 0.9.0, and three-OS CI are present.

### Blocking

None found. No prior HIGH blocker reopened.

### Important

- Export still omits `proposals/`, although import accepts them; proposal portability therefore is not round-trip complete ([src/portability.ts:41](C:/dev/projects/gotcontext-memory/src/portability.ts:41)).
- The new focus/drop/replace/receipt/`nowMs` behavior lacks direct regression coverage in the supplied tests.
- Replace silently ignores deletion failures instead of counting them as rejected ([src/portability.ts:92](C:/dev/projects/gotcontext-memory/src/portability.ts:92)).
- The mutation guard remains filename-based rather than path-sensitive.

These are assurance/completeness gaps, not demonstrated HIGH data-loss, security, or canonical-write bypass defects.

### Honesty

README and HONESTY now accurately qualify Codex/Cursor tool/skill metadata, agy/OpenCode partial status, MCP limitations, permission scope, HITL-only dreaming, and the 0.9.0 release state. No material overclaim found.

Read-only audit; no edits and no Node/SQLite execution. The reported 48 passing tests was not rerun.

RECOMMENDED: PASS — Core gates hold, prior HIGH blockers remain closed, and remaining gaps are non-blocking.
