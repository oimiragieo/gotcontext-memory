# Codex re-audit round 4

Read-only re-audit; no files changed and tests were not rerun. The supplied BUNDLE contained headings only, so targeted live-tree checks were necessary.

All three prior HIGH blockers are closed:

- Uninstall now reads through `MemoryStore.read()` and updates the store manifest via `commitOperational()` ([installer.ts](C:/dev/projects/gotcontext-memory/src/installer.ts:117), [installer.ts](C:/dev/projects/gotcontext-memory/src/installer.ts:151)).
- Proposal IDs are restricted to one safe segment before store reads or writes ([review.ts](C:/dev/projects/gotcontext-memory/src/review.ts:14), [guards.test.ts](C:/dev/projects/gotcontext-memory/test/guards.test.ts:101)).
- CI contains valid `node: ["22"]` matrix YAML without the prior corruption ([ci.yml](C:/dev/projects/gotcontext-memory/.github/workflows/ci.yml:8)).

### Tasks 1–12

1. **PARTIAL** — Store APIs, CAS, locks, revisions, journal, and containment exist. The AST guard still wholesale-allows `installer.ts` and `portability.ts`, rather than proving their writes are external-only ([guards.test.ts](C:/dev/projects/gotcontext-memory/test/guards.test.ts:26)).
2. **DONE** — Canonical secret scanning is deny-by-default, with tested allowlist provenance ([store.ts](C:/dev/projects/gotcontext-memory/src/store.ts:288), [secrets.test.ts](C:/dev/projects/gotcontext-memory/test/secrets.test.ts:31)).
3. **PARTIAL** — Pure regeneration and caps exist, but expiry filtering depends on `Date.now()`, weakening deterministic-output guarantees ([index.ts](C:/dev/projects/gotcontext-memory/src/index.ts:12)).
4. **PARTIAL** — Explicit tiers and default-off dreaming exist; merged user/project reads with per-entry provenance remain absent ([config.ts](C:/dev/projects/gotcontext-memory/src/config.ts:29)).
5. **PARTIAL** — Three independent importers and honest agy/OpenCode labels exist. Codex/Cursor still emit empty tool/skill metadata ([codex.ts](C:/dev/projects/gotcontext-memory/src/corpus/codex.ts:52), [cursor.ts](C:/dev/projects/gotcontext-memory/src/corpus/cursor.ts:81)).
6. **PARTIAL** — Proposal-only dreaming, empty-corpus refusal, deterministic IDs, secret withholding, and hash invariance exist. Extraction remains preference-centric, and returned `dropped` ignores proposal-cap drops ([run.ts](C:/dev/projects/gotcontext-memory/src/dream/run.ts:42), [run.ts](C:/dev/projects/gotcontext-memory/src/dream/run.ts:204)).
7. **PARTIAL** — Traversal refusal, preflight, locks, rollback, accept/reject, expiry, and delete confirmation exist. The planned `review show` CLI action is absent ([cli.ts](C:/dev/projects/gotcontext-memory/src/cli.ts:181)).
8. **PARTIAL** — Five fragments, dry-run, byte pre-images, and MemoryStore-backed manifest updates exist. `init --mcp` prints guidance instead of registering harness MCP configuration ([cli.ts](C:/dev/projects/gotcontext-memory/src/cli.ts:59)).
9. **PARTIAL** — Doctor checks scanner, memories, index, caps, partial labels, and accept-error receipts ([doctor.ts](C:/dev/projects/gotcontext-memory/src/doctor.ts:21), [doctor.ts](C:/dev/projects/gotcontext-memory/src/doctor.ts:121)). Revision consistency, adapter state, and measured corpus availability remain absent.
10. **PARTIAL** — Canonical imports use guarded commits and archive paths are contained. `replace` is operationally identical to merge, proposals are omitted, and no durable import receipt is produced ([portability.ts](C:/dev/projects/gotcontext-memory/src/portability.ts:41), [portability.ts](C:/dev/projects/gotcontext-memory/src/portability.ts:85)).
11. **PARTIAL** — Read/search/commit/propose handlers exist and writes use `MemoryStore`. It remains an honestly labeled MCP-like JSON-RPC loop without SDK conformance or installer registration ([server.ts](C:/dev/projects/gotcontext-memory/src/mcp/server.ts:2)).
12. **PARTIAL** — Policy exclusion, proposal limits, documentation, and valid three-OS CI exist. `focus` is unused and cap-drop reporting is incorrect ([policy.ts](C:/dev/projects/gotcontext-memory/src/dream/policy.ts:1), [run.ts](C:/dev/projects/gotcontext-memory/src/dream/run.ts:167)).

### Important gaps

- Strengthen the mutation guard so installer and portability exceptions are path-sensitive.
- Correct dream’s returned drop count and implement `focus`.
- Give `--replace` real replacement semantics; include proposals and durable import receipts.
- Either implement MCP registration/protocol compliance or retain the current explicitly limited positioning.
- Complete doctor’s revision, adapter, and corpus-availability checks.

### Honesty risks

- Calling Codex and Cursor corpus support “Full” overstates preservation of tool and skill metadata ([HONESTY.md](C:/dev/projects/gotcontext-memory/docs/HONESTY.md:15)).
- The generated BUNDLE is effectively empty, so it is not a reproducible audit artifact.
- MCP and permission-scope limitations are now disclosed accurately.

RECOMMENDED: PASS_WITH_FIXES — All three prior HIGH blockers are closed; remaining gaps are important but non-blocking.
