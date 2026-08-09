## Tasks 1–12

1. **Task 1 — PARTIAL.** CAS commits, operational writes, tree hashing, locks, atomic rename, journaling, and a real two-process race test exist (`src/store.ts:43-307`, `test/store.test.ts:14-124`). Completion is blocked by missing rollback, missing revision metadata sidecars, incomplete path-containment arms, and an AST guard that unconditionally exempts installer/portability instead of proving their carve-outs (`test/guards.test.ts:59-75`; plan `:101-107`).

2. **Task 2 — PARTIAL.** Four scanner patterns and a pre-write canonical gate exist (`src/secrets.ts:3-34`, `src/store.ts:205-230`). Tests cover only AWS rejection and a clean control; no PAT/generic-key/PEM arms, scanner self-test, configured allowlist, or provenance-sidecar receipt exists (`test/secrets.test.ts:8-34`; plan `:114-120`).

3. **Task 3 — PARTIAL.** Deterministic index generation and commit-time caps exist (`src/index.ts:11-46`, `src/store.ts:218-223`). The only test checks determinism; cap rejection, under-cap control, exact enumeration/deletion, and write-free guard arms are absent (`test/dream.test.ts:91-104`; plan `:126-132`).

4. **Task 4 — PARTIAL.** User/project resolution and ambiguous-store refusal exist (`src/paths.ts:14-45`, `src/cli.ts:16-29`). There is no `config.ts`, strict schema, project-over-user merged read model, provenance by tier, or relevant tests; defaults are hard-coded during initialization (`src/store.ts:61-75`; plan `:134-144`).

5. **Task 5 — PARTIAL.** Claude JSONL parsing and labeled agy/OpenCode stubs exist (`src/corpus/claude.ts:11-134`, `src/corpus/agy.ts:3-15`, `src/corpus/opencode.ts:3-15`). Codex and Cursor merely relabel Claude-format output; Cursor explicitly defers `node:sqlite` (`src/corpus/codex.ts:3-18`, `src/corpus/cursor.ts:3-18`). The format contract documents only Claude (`docs/adapters/transcript-formats.md:1-9`), contrary to the three fixture-pinned full importers required by plan `:146-159`.

6. **Task 6 — PARTIAL.** Dream runs are explicit, proposal-only, secret-filtered, deterministically identified, and guarded by `memoryTreeHash` (`src/dream/run.ts:24-119`). Extraction implements only `create` preferences, passes an empty hash map, and has no update/supersede/expire/delete lenses, policy, scope enforcement, or tested idempotency/staleness arms (`src/dream/run.ts:35-70,90-105`; plan `:161-172`).

7. **Task 7 — PARTIAL.** List, reject, accept, CAS, index regeneration, and delete confirmation exist (`src/review.ts:10-129`). The implementation does not validate proposal schema/expiry, does not pre-check the generated index, can half-apply, implements expire as deletion, and leaves accepted source proposals active. Only happy accept and reject are tested (`test/dream.test.ts:24-89`; plan `:174-185`).

8. **Task 8 — PARTIAL.** Five adapter entries, common fragments, dry-run, and managed-block upsert exist (`src/adapters/types.ts:11-54`, `src/installer.ts:7-38`). There is no manifest, uninstall, pre-image restoration, tamper hash, `--force`, real detection, runtime store-integrity arm, or installer test file (`src/cli.ts:41-68`; plan `:187-199`).

9. **Task 9 — PARTIAL.** A command named `doctor` prints the root, tree hash, and unconditional `"store": "ok"` (`src/cli.ts:162-177`). No `doctor.ts`, integrity checks, cap headroom, corpus/adapter reports, scanner self-test, empty labels, or corruption tests exist (plan `:201-211`).

10. **Task 10 — MISSING.** No portability module, CLI export/import commands, receipts, archive path validation, or tests exist; CLI command registration ends after the doctor stub (`src/cli.ts:162-180`; plan `:213-223`).

11. **Task 11 — MISSING.** No MCP server, SDK dependency, `--mcp` installer behavior, tools, or tests exist (`package.json:24-35`, `src/cli.ts:32-180`; plan `:225-236`).

12. **Task 12 — PARTIAL.** Basic honesty documents and the default-off initialization value exist (`docs/HONESTY.md:1-8`, `src/store.ts:61-74`). There is no `dream/policy.ts`, policy consumption, memory-policy adapter steering, CI workflow, pack/install smoke gate, or cross-platform matrix; nevertheless the package already declares version `1.0.0` (`package.json:2-4`; plan `:238-250`).

## Blocking defects

- **CRITICAL — Task 7: accept can leave canonical state half-applied.** Index bytes are generated but neither cap- nor secret-preflighted; the target is committed before `MEMORY.md`, whose gate may then fail (`src/review.ts:67-115`, `src/store.ts:215-223`). No durable error receipt or doctor-detectable `INDEX_DRIFT` is written. **Fix:** validate proposal/path/expiry, scan and cap-check target plus index before locks, then implement the documented post-target failure receipt and drift diagnostic (`plan:20,180-184`).

- **HIGH — Task 7: accepted proposals remain pending and expire means hard delete.** Accept copies the proposal into `accepted/` but never removes the original (`src/review.ts:119-128`), so `listProposals()` will keep returning it (`src/review.ts:10-19`). Expire calls `deleteCanonicalLocked()` (`src/review.ts:89-99`). **Fix:** operationally move/remove the source only after both canonical commits succeed; implement expiry metadata separately from forced deletion.

- **HIGH — Task 1: lexical containment permits symlink/junction escape.** The resolver rejects textual traversal but never resolves or checks existing ancestors for links (`src/paths.ts:47-80`). The sole test covers only `../` (`test/store.test.ts:81-92`), despite required absolute, Windows, and symlink arms (`plan:24,101`). **Fix:** reject symlink/junction ancestors using canonicalized real paths and add absolute, drive, UNC, reserved-name, and link-escape tests for every consumer.

- **HIGH — Tasks 1/8/10: the sole-writer guard contains an unchecked escape hatch.** It skips all of `installer.ts` and hypothetical `portability.ts` without verifying that their targets are external (`test/guards.test.ts:59-75`). **Fix:** make the carve-out call- and destination-sensitive; prove installer cannot target a store and portability can only write the explicit external archive path (`plan:15,198,222-223`).

- **HIGH — Task 2: callers can self-authorize secret bypass.** Canonical scanning trusts `opts.provenance.allowlist` supplied by the committing caller (`src/store.ts:205-216`), rather than validated store configuration, and no sidecar records the decision. **Fix:** remove caller-controlled bypass, load a strict configured allowlist through the store, and persist the named allowlist decision in revision provenance (`plan:116-120`).

- **HIGH — Task 5: two claimed full importers are format aliases, not importers.** Codex and Cursor delegate to the Claude parser (`src/corpus/codex.ts:3-18`, `src/corpus/cursor.ts:3-18`), while the approved contract requires independent fixture-pinned Codex and read-only SQLite Cursor implementations (`plan:146-159`). **Fix:** implement their actual pinned formats with positive, malformed, metadata, non-code, and permission-scope fixtures.

- **HIGH — Task 8: installation cannot be safely reversed.** Direct adapter writes are allowed, but no manifest or pre-images are retained and the CLI exposes no uninstall (`src/installer.ts:7-27`, `src/cli.ts:41-68`). **Fix:** add hashed managed blocks, tamper refusal/`--force`, an external or store-mediated manifest, byte-faithful uninstall, idempotence, and sandbox tests (`plan:187-199`).

- **HIGH — Tasks 9–12: required release surfaces are not built.** Doctor is an unconditional stub, while portability, MCP, policy, and CI are absent (`src/cli.ts:162-180`, `package.json:24-35`). **Fix:** implement Tasks 9–12 and their red arms before retaining a plan-complete or v1.0 release claim (`plan:201-250`).

## Important gaps

- Revision history stores only prior raw bytes, without the required metadata sidecar, and exposes no rollback operation (`src/store.ts:233-240,282-288`; plan `:16,101`). Add atomic revision metadata and rollback-as-new-revision tests.

- `deleteCanonicalLocked()` does not enforce that its target is canonical, unlike `commitCanonicalLocked()` (`src/store.ts:205-214,272-290`). Add the same canonical-path predicate before any read or removal.

- `proper-lockfile` is range-versioned rather than pinned (`package.json:24-27`), contrary to the explicit pinned-dependency requirement (`plan:9,104`). Use an exact version and lockfile-backed CI install.

- Config behavior is split between initialization and CLI logic (`src/store.ts:61-75`, `src/cli.ts:16-29`). Implement strict `config.ts`, reject unknown/auto/schedule keys, and make tier resolution a single tested authority (`plan:134-144,244`).

- The partial stubs do not enumerate candidate transcript paths as required; they return only zero counts (`src/corpus/agy.ts:3-15`, `src/corpus/opencode.ts:3-15`; plan `:153`).

- The dream’s `base_hash` map is never populated, so every generated target effectively begins from `"absent"` (`src/dream/run.ts:90-91,59-60`). Add current-store hash loading and real update/supersede/staleness candidate generation.

## Honesty / overclaim risks

- README presents HITL dreaming for all five harnesses without qualifying that Codex/Cursor are Claude-format mirrors and agy/OpenCode are empty stubs (`README.md:3-9`, `src/corpus/codex.ts:3-18`, `src/corpus/cursor.ts:3-18`). `HONESTY.md` qualifies only agy/OpenCode (`docs/HONESTY.md:6`). The matrix should label actual corpus support per harness.

- “Permission-scoped transcripts” is too strong (`docs/HONESTY.md:3`). Project filtering is only a parent-directory basename comparison, while the CLI directs non-Claude sources to placeholder store fixture paths (`src/corpus/claude.ts:33-41`, `src/cli.ts:93-102`). Label this fixture-level/partial until path-identity and reconciliation arms pass.

- The package declares `1.0.0` before the approved release gate, despite the plan forbidding the v1 tag before CI, smoke installation, and CEO publication approval (`package.json:2-4`, plan `:246-250`).

- The human-edit claim says the next commit uses current disk bytes as the CAS base (`docs/HONESTY.md:7`), but the API requires the caller to supply `baseHash` and provides no reconciliation workflow (`src/store.ts:122-130,196-199`). Document the manual requirement or implement the promised reconciliation.

- Required honesty topics—caps, CAS details, uninstall guarantee, adapter matrix, and global-constraint parity—are absent from the very short README/HONESTY pair (`README.md:31-38`, `docs/HONESTY.md:1-8`; plan `:245`).

## Test oracle gaps

- **Tasks 1–3:** Missing delete/rollback/revision-sidecar arms, absolute/symlink/Win32 containment, operational containment, both index caps, under-cap control, exact index deletion/enumeration, and secret pattern/allowlist/self-test arms (`plan:101-105,114-119,126-131`; current coverage `test/store.test.ts:14-124`, `test/secrets.test.ts:8-34`, `test/dream.test.ts:91-104`).

- **Tasks 4–5:** No config tests; no two-session positive fixtures, malformed-sibling survival, exact skill/tool counts, reconciliation equation, non-code fixture, independent Codex/Cursor formats, or stub candidate-path assertions (`plan:138-157`; current corpus coverage is only the empty Claude case at `test/dream.test.ts:13-22`).

- **Tasks 6–7:** Missing miswired-writer control, explicit empty-corpus assertion, action-schema coverage, deterministic rerun, real base hash, staleness, scoped exclusion, secret withholding, cap-preflight rollback, stale CAS, create-exists, expired proposal, expire/delete, journal, and post-target failure-contract arms (`plan:165-171,178-184`; current coverage `test/dream.test.ts:24-89`).

- **Task 8:** No installer test file at all; therefore dry-run zero-tree-hash, idempotence, pre-image uninstall, tamper refusal, fragment parity, detection, and pre-existing-store integrity are unproved (`plan:191-199`; installer behavior currently resides only at `src/installer.ts:7-38`).

- **Tasks 9–12:** No doctor, portability, MCP, policy, adapter-policy, CI-matrix, pack/install, or doctor-smoke tests exist (`plan:205-210,217-223,229-235,242-249`; the configured suite discovers only `test/**/*.test.ts` at `vitest.config.ts:3-8`).

RECOMMENDED: FAIL — Core CAS exists, but mandatory safety, corpus, review, portability, MCP, doctor, policy, and release gates remain incomplete.
