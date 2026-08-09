
## FULL PLAN TEXT

# Gotcontext Memory Multi-Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `gotcontext-memory` — an installable Node/TypeScript package giving Claude Code, Antigravity (agy), Codex, OpenCode, and Cursor one disk-canonical markdown memory plane at `~/.gotcontext/` and/or `<project>/.gotcontext/`, with a single write API (`MemoryStore.commit()` — sha256 CAS, atomic rename, revision sidecars, secret scan, index caps) and an out-of-band **HITL transcript-dream loop** (corpus → `gcm dream` proposals → `gcm review` accept/reject). No omega dependencies.

**Architecture:** Locked **C — Hybrid** per `docs/thinktank_council_20260808_155453/CHAIRMAN_SYNTHESIS.md` (4/4 verdict seats). Disk-canonical markdown store; CLI-only dreaming in v1 (daemon is v1.1+ and may only *queue* proposals — never a second write path); adapters are managed instruction fragments for all five harnesses plus an optional shared MCP server; honesty boundary = parity with omega `transcript_dream` HITL only, never `memory_dream` auto-supersede (fable-audit CE honesty flags; `_dream_audit\fable-audit.md`).

**Tech Stack:** Node/TypeScript preferred (one cross-platform CLI). Node ≥ 22, ESM, `commander` for CLI, `vitest` for tests, `yaml` for frontmatter. No native modules; Windows + macOS + Linux from Node only (no bash-only installer). Optional SQLite appears **nowhere in v1** (codex seat: SQLite only ever as a rebuildable cache, and not in this version).

## Global Constraints

These are load-bearing; every task's tests must respect them. Sources: BRIEF constraints, CHAIRMAN_SYNTHESIS §Partial-Agreement resolutions, fable-audit CE-10..15 (guardrails: versioning+rollback+provenance, hash CAS, permission tiers, portability), `transcript-dream-hitl` SKILL.md (HITL contract), `_dream_audit\plan.md` / `research.md` (production failure modes: multi-writer, bad org-wide write, staleness, malicious injection), and `omega-jarvis\docs\superpowers\specs\2026-08-07-context-engineering-dreaming-design.md` (proposal/receipt shapes).

1. **Sole store-root mutation path = `store.ts`.** Every filesystem mutation under a `.gotcontext` store root (canonical memory, MEMORY.md, proposals, receipts, locks, revisions, config) goes through `MemoryStore` methods in `src/store.ts` only. Canonical path: `commitCanonical()` (CAS + secret scan + caps + revisions + commit journal). Operational path: `commitOperational()` (atomic write/move for proposals/receipts/config/locks; secret scan on proposal bodies; no MEMORY.md caps). Typed `deleteCanonical(path, baseHash)` captures prior bytes into revisions + journal, then removes/tombstones. The AST guard asserts **zero** `fs.writeFile`/`writeFileSync`/`rename`/`renameSync`/`unlink`/`rm`/`createWriteStream` call sites in any `src/**` module except `store.ts` (and `installer.ts` only for **non-store** adapter files). Positive-control fixture is an in-memory source string, not a real violating file in `src/`.
2. **CAS everywhere on canonical commits.** `commitCanonical()` takes `baseHash` (sha256 of prior bytes, or `"absent"`). Mismatch → typed `CasConflict`, store byte-identical. Tempfile-in-same-dir → close handle → `fs.rename`. Prior bytes → `revisions/` + sidecar **and** append-only `commits.jsonl` journal (covers new-file commits with no prior-byte revision). **Cross-process lock:** dependency `proper-lockfile` (pinned) with documented stale/retry; Task 1 concurrent-writer test **spawns two child processes**, not in-process `Promise.all`.
3. **Fresh install never dreams unprompted.** No schedule, no hook, no post-install trigger. `dream.enabled` config defaults to a state that only affects future opt-in tooling; `gcm dream` runs only when a human invokes it. Default-OFF is a tested property, not a comment.
4. **Hash scopes are named and tested.** `memoryTreeHash(store)` hashes **only** canonical memory markdown files under `memory/` plus `MEMORY.md`. It **excludes** `proposals/`, `revisions/`, `receipts/`, `locks/`, tempfiles, `commits.jsonl`, and `config.json`. Dream/review zero-write invariants use **`memoryTreeHash` only**. Controls: proposal-file change must **not** move `memoryTreeHash`; one-byte memory change must.
5. **Dream run leaves `memoryTreeHash` identical.** Proposals via `commitOperational()` under `.gotcontext/proposals/` only. Dream self-checks `memoryTreeHash` before/after. Proposal bodies+evidence secret-scanned before write; findings → withheld + labeled count. **Idempotency:** proposal `id` is a deterministic content hash of `{action,targetPath,base_hash,body,evidenceQuotes}`; `createdAt` is exempt from equality — re-run yields the same id set (no duplicate ids).
6. **Accept is preflighted, then multi-commit with an explicit failure contract.** Before mutating: validate proposal, path containment, regenerate index bytes, **pre-check index caps/secrets**, acquire locks in deterministic path order. Then `commitCanonical(target)` → `commitCanonical(MEMORY.md)` → `commitOperational(proposal move + receipt)`. Proposal is marked accepted **only after** all required canonical commits succeed. If preflight fails → `memoryTreeHash` unchanged. If a later step fails after target commit (should be rare post-preflight) → durable error receipt + doctor-detectable `INDEX_DRIFT` with suggested `gcm doctor --repair-index` (no silent half-accept).
7. **Reject leaves `memoryTreeHash` identical** (operational proposal move only). Accept uses proposal `base_hash` via `commitCanonical`.
8. **Empty corpus refuses with an explicit zero label.** `EMPTY_CORPUS — proves nothing; scanned=N included=0 excluded_permission=M …`
9. **Permission-mirrored corpus (CE-8).** Scope filter + reconcile counts as before.
10. **Path containment.** Every path from CLI/archive/proposal/MCP/frontmatter is normalized; reject absolute paths, `..` traversal, reserved names, symlink/junction escape, and Windows drive/UNC escapes. Tests cover these arms for import + MCP + review.
11. **No omega dependencies** in `package.json` or runtime imports. No Telegram, voice, speaker-gate, `OMEGA_FACTS_DB`.
12. **Honesty labels.** agy/OpenCode corpus importers labeled partial until dogfood receipts.
13. **Index caps.** `MEMORY.md` ≤ ~200 lines / 25KB; rejected with typed overage error.
14. **Secret scan** deny-by-default on canonical commits and proposal writes; never default-off.
15. **Cross-platform paths** via `node:path`; win32 fixtures; close temp handles before rename.
16. **Staleness actions.** `create|update|supersede|expire|delete`; delete via `deleteCanonical` / `--yes-delete` two-step.
17. **Human direct edits.** Next commit uses current on-disk bytes as CAS base. Documented in `docs/HONESTY.md`.
18. **Importer specs are fixture-pinned.** Task 5 documents version-pinned transcript formats in `docs/adapters/transcript-formats.md`; local machine is spot-check only, never the contract source.

## File map

Every path created and its one responsibility:

```
gotcontext-memory/
  package.json                    # ESM package, bin: gcm + gotcontext-memory, zero omega deps
  tsconfig.json                   # strict TS, NodeNext
  vitest.config.ts                # test runner config
  src/
    paths.ts                      # store-root resolution (user ~/.gotcontext vs project .gotcontext), ~ expansion (sole site)
    hash.ts                       # sha256 helpers; memoryTreeHash(store) vs optional storeTreeHash; path-include/exclude contract
    frontmatter.ts                # parse/serialize memory-file YAML frontmatter (name/description/type/provenance)
    store.ts                      # MemoryStore: commitCanonical, commitOperational, deleteCanonical, locks (proper-lockfile), journal, path containment
    secrets.ts                    # secret patterns + scan(bytes); used by canonical + operational proposal writes
    index.ts                      # regenerateIndex(store) PURE bytes only; persisted only via commitCanonical
    config.ts                     # .gotcontext/config.json via commitOperational
    corpus/
      types.ts                    # Transcript (+ tool_events, skill_invocations), CorpusSource.scan({scope}); counts
      claude.ts                   # Claude importer against fixture-pinned format doc
      codex.ts                    # Codex importer (fixture-pinned)
      cursor.ts                   # Cursor importer (fixture-pinned)
      agy.ts                      # partial stub
      opencode.ts                 # partial stub
    dream/
      run.ts                      # dream: scoped corpus → extract → commitOperational(proposals); memoryTreeHash invariant
      proposal.ts                 # schema + deterministic content-hash ids
      policy.ts                   # dream.policy + memory.policy
    review.ts                     # HITL accept preflight→multi-commit; reject operational-only

    adapters/
      types.ts                    # Adapter contract: fragmentPath(s), render(fragment), detect(), managed-block markers
      claude-code.ts              # CLAUDE.md / settings managed fragment
      antigravity.ts              # agy instruction fragment
      codex.ts                    # AGENTS.md fragment
      opencode.ts                 # OpenCode fragment
      cursor.ts                   # .cursor rules fragment
    installer.ts                  # gcm init/--dry-run/--uninstall: writes managed blocks, records manifest for clean uninstall
    doctor.ts                     # gcm doctor: store integrity, adapter presence, cap status, corpus availability + partial labels
    portability.ts                # gcm export/import: tarball of store + revisions + config; import via commit() only
    mcp/server.ts                 # optional shared MCP server (read + commit-mediated write tools); harnesses that register MCP
    cli.ts                        # command wiring only; no business logic
  test/
    guards.test.ts                # no-omega-deps; no fs.write outside store.ts under store roots (AST walk, not grep)
    store.test.ts                 # CAS bidirectional arms, rename atomicity, revision sidecars, rollback
    secrets.test.ts               # planted-secret rejection (control) + clean-commit pass (treatment)
    index.test.ts                 # cap rejection + regeneration determinism
    corpus.test.ts                # importers on fixture transcripts; per-source zero labels
    dream.test.ts                 # tree-hash-identical, empty-corpus refusal, proposal schema
    review.test.ts                # reject byte-identical; accept CAS; stale base_hash conflict
    installer.test.ts             # dry-run writes nothing; init idempotent; uninstall restores byte-identical
    doctor.test.ts                # detects seeded corruption; green on healthy store
    portability.test.ts           # export→wipe→import round-trip hash equality
    fixtures/                     # sample transcripts per harness, planted secrets, oversized index
  docs/
    HONESTY.md                    # what "dreaming" means here (HITL only), partial-corpus labels, what we do NOT claim
  README.md                       # install, quickstart, adapter matrix, honesty boundary
```

## Serial Tasks

### Task 1 — Package scaffold + `MemoryStore` (canonical/operational/delete + locks + guards)

**Goal:** The sole store-root mutation module exists and is provably sole. (Round-2 F1/codex: commitCanonical + commitOperational + deleteCanonical.)
**Files:** `package.json` (pin `proper-lockfile`), `tsconfig.json`, `vitest.config.ts`, `src/paths.ts`, `src/hash.ts`, `src/frontmatter.ts`, `src/store.ts`, `test/store.test.ts`, `test/guards.test.ts`
**Red-arm test first:** `store.test.ts :: "commitCanonical with stale baseHash throws CasConflict and leaves file bytes unchanged"`

- [ ] 1. Write failing tests: (a)–(e) as before for CAS/revisions/rollback but against `commitCanonical`; (f) **two child processes** concurrent `commitCanonical` → exactly one wins, loser `CasConflict`; (g) `memoryTreeHash` ignores proposals, detects memory byte change; (h) `deleteCanonical` with correct baseHash removes/tombstones and journals; stale baseHash refuses; (i) path containment rejects `../`, absolute, and symlink escape; (j) `commitOperational` writes proposal without changing `memoryTreeHash`.
- [ ] 2. Guard tests: AST allowlist = only `store.ts` (+ `installer.ts` for non-store paths) may call listed fs mutation APIs; positive control = in-memory fixture string flagged.
- [ ] 3. Run red for right reasons.
- [ ] 4. Implement with `proper-lockfile` (pinned); document stale/retry in code comment; win32 handle-close before rename.
- [ ] 5. Green + win32 path fixtures.

**Done when:** All arms pass including cross-process CAS and path containment; guard decidable and honest.
**Do NOT:** Allow dream/review to call `fs.*` directly; use in-process-only concurrency as the sole CAS proof.

### Task 2 — Secret-scan commit gate (bidirectionally validated)

**Goal:** No committed memory can contain a credential; the scanner is proven capable of firing before it is trusted (broken-oracle trap, TRUSTWORTHY-EVAL discipline).
**Files:** `src/secrets.ts`, `src/store.ts` (wire gate), `test/secrets.test.ts`, `test/fixtures/planted-secrets/*`
**Red-arm test first:** `secrets.test.ts :: "commit of body containing planted AWS key throws SecretDetected; file absent; no revision written"`

- [ ] 1. Write failing tests: (a) planted secrets (AWS key, GitHub PAT, generic `api_key: sk-…`, private-key PEM header) each rejected with the pattern named; store tree-hash unchanged; (b) **treatment arm:** clean body commits fine; (c) allowlist in config permits a named false-positive pattern and the allowlist decision is recorded in the provenance sidecar; (d) scanner self-test: `scan()` over the fixture set returns ≥ N findings — an empty findings list from the fixture dir is a scanner failure, never a clean bill (zero-label law).
- [ ] 2. Run failing; implement pattern set + `commit()` gate ordering (scan BEFORE tempfile write, so nothing secret ever touches disk); run green.

**Done when:** Both arms discriminate; scan happens pre-write; a comments-only body mentioning the *word* "secret" passes (grep-vs-read distinction: patterns match token shapes, not vocabulary).
**Do NOT:** Scan the *existing* store on every commit (that's `doctor`'s job). Do NOT make the gate default-off — deny-by-default stays active; bypass only via explicit allowlist/config recorded in provenance.

### Task 3 — MEMORY.md index generation + caps

**Goal:** Deterministic index regeneration from store files; hard caps (~200 lines / 25KB) enforced at commit, rejected loudly (copilot seat: caps blocking for honesty).
**Files:** `src/index.ts`, `src/store.ts` (cap gate on MEMORY.md commits), `test/index.test.ts`, `test/fixtures/oversized-index/*`
**Red-arm test first:** `index.test.ts :: "commit pushing MEMORY.md past 25KB throws IndexCapExceeded naming the overage; index bytes unchanged"`

- [ ] 1. Failing tests: (a) cap rejection with overage named (lines and bytes); (b) control: under-cap commit passes; (c) `regenerateIndex(store)` is **pure** (returns bytes; zero filesystem writes — AST/guard assert) and byte-deterministic across two runs on identical input (no timestamps in output); (d) regeneration lists every memory file exactly once and drops entries whose file is gone; (e) callers that persist the index must `commit()` the returned bytes (review/portability integration covered in Tasks 7/10).
- [ ] 2. Implement; index lines follow the house form `- [Title](file.md) — hook`; run green.

**Done when:** Caps bite bidirectionally; regeneration is idempotent (second run = byte-identical); pure function proven write-free.
**Do NOT:** Auto-truncate or auto-summarize on overflow — rejection forces a human/dream-proposal decision (summarising a rule changes it). Do NOT have `regenerateIndex` call `fs.write*` itself.

### Task 4 — Store resolution + config (`user` vs `project` tiers)

**Goal:** `paths.ts`/`config.ts` resolve which store(s) are live: project `.gotcontext/` when present, user `~/.gotcontext/` always; explicit tier addressing (`--store user|project`) for writes (permission-tier guardrail, fable-audit CE table).
**Files:** `src/config.ts`, `src/paths.ts` (extend), `src/cli.ts` (skeleton wiring for `gcm` with global `--store`), `test/config.test.ts` additions inside `store.test.ts` or new file
**Red-arm test first:** `config.test.ts :: "write addressed to project tier with no project store present refuses with valid-options list, creates nothing"`

- [ ] 1. Failing tests: (a) ambiguous write (both stores present, no `--store`) refuses and names both options — never guesses (ground-actions-to-registry pattern: closed vocabulary, reject unknowns with valid options); (b) reads merge project-over-user with provenance of which tier each entry came from; (c) config schema rejects unknown keys with the key named; (d) `dream.enabled` **absent and schedule-free by default** — assert no config default can cause an unprompted dream (Global Constraint 3's first tested surface).
- [ ] 2. Implement; run green on win32 + posix path fixtures.

**Done when:** Tier addressing is explicit-or-refuse; default config passes the "never dreams unprompted" assertion.
**Do NOT:** Implement an org/team tier (out of scope v1); write any file during a refused resolution.

### Task 5 — Corpus importers: Claude Code, Codex, Cursor (+ labeled agy/OpenCode stubs)

**Goal:** `CorpusSource` implementations turning each harness's on-disk session logs into normalized `Transcript` objects, with **per-source scan counts** so zero is always labeled (CHAIRMAN §Partial-Agreement: Claude+Codex+Cursor full in v1; agy/OpenCode partial with honest labels).
**Files:** `src/corpus/types.ts`, `src/corpus/{claude,codex,cursor,agy,opencode}.ts`, `test/corpus.test.ts`, `test/fixtures/transcripts/{claude,codex,cursor}/*`
**Red-arm test first:** `corpus.test.ts :: "claude importer on fixture dir with zero sessions returns {transcripts: [], scanned: 0, included: 0, excluded_permission: 0, label: 'EMPTY'} — never a bare empty array"`

- [ ] 1. Failing tests per full importer: (a) zero-sessions dir → explicit `scanned: 0` + `EMPTY` label; (b) **positive control**: fixture with 2 known sessions → exactly 2 transcripts with expected turn counts; (c) malformed session file → recorded in `errors[]` with path, not silently skipped and not fatal to siblings; (d) turns preserve role, text, timestamp, source-file provenance, plus `tool_events` and `skill_invocations` when present; (e) fixture JSONL with 2 known Skill/`tool_use` events → exactly 2 `skill_invocations` entries; (f) **CE-8 scope arm:** `scan({scope:'project', cwd})` includes in-project transcript, excludes out-of-project, and `included + excluded_permission (+ malformed accounting) = scanned`.
- [ ] 2. Failing tests for agy/OpenCode stubs: they return `label: 'PARTIAL — no dogfood receipts'` and enumerate candidate paths they *would* read; doctor (Task 9) will surface this.
- [ ] 3. Implement against **fixture-pinned** formats documented in `docs/adapters/transcript-formats.md` (version + field map). Spot-check a live machine only to discover gaps; encode unverifiable fields as null with fixture comments. Include ≥1 non-code fixture.
- [ ] 4. Run green.

**Done when:** Three full importers pass positive + zero-label + malformed + skill-metadata + CE-8 scope arms; stubs carry honest partial labels.
**Do NOT:** Reach into harness config/credential files; claim agy/OpenCode corpus support anywhere user-facing; default-scope to “everything in the time window”.

### Task 6 — `gcm dream`: proposals only, zero writes, empty-corpus refusal

**Goal:** The dream run: corpus → candidate memory extraction → `proposals/*.json`, with the tree-hash-identical invariant self-enforced (HITL contract from `transcript-dream-hitl` SKILL.md; proposal shape per the 2026-08-07 context-engineering-dreaming spec).
**Files:** `src/dream/run.ts`, `src/dream/proposal.ts`, `src/cli.ts` (wire `gcm dream`), `test/dream.test.ts`
**Red-arm test first:** `dream.test.ts :: "dream over fixture corpus leaves memoryTreeHash byte-identical before vs after; control: a deliberately mis-wired writer variant is caught by the same assertion"`

- [ ] 1. Failing tests: (a)–(c) as before with `memoryTreeHash` / EMPTY_CORPUS / schema `create|update|supersede|expire|delete`; (d) **idempotency:** two runs → same deterministic proposal id set (`createdAt` exempt); (e)–(h) base_hash embed, staleness expire, CE-8, proposal secret withhold as before.
- [ ] 2. Implement extraction lenses (corrections, preferences, repeated facts, contradictions, stale bullets); `scan()` then `commitOperational` for proposals.
- [ ] 3. Wire CLI; run green.

**Done when:** All arms pass including deterministic ids + secret withhold + CE-8.
**Do NOT:** Write canonical memory; schedule; network/LLM; claim `memory_dream` parity.

### Task 7 — `gcm review`: HITL accept/reject/expire with base_hash CAS

**Goal:** The human gate. List/show proposals with evidence quotes; accept commits through `MemoryStore.commit(base_hash)`; reject/expire never touch the store (Global Constraint 5).
**Files:** `src/review.ts`, `src/cli.ts` (wire `gcm review [list|show|accept|reject] <id>`), `test/review.test.ts`
**Red-arm test first:** `review.test.ts :: "reject leaves memoryTreeHash byte-identical; accept of create/update changes the declared canonical path set and leaves excluded operational paths accounted for"`

- [ ] 1. Failing tests: (a) reject → `memoryTreeHash` identical; (b) accept create/update with **preflight** that would exceed MEMORY.md cap → abort, `memoryTreeHash` unchanged; (c) accept success → target + MEMORY.md committed, proposal accepted only after both; journal entries exist; (d) stale-CAS arm; (e) create-where-exists conflict; (f) proposal expiresAt past refuse; (g) expire accept drops from regenerateIndex; (h) delete two-step / `--yes-delete` via `deleteCanonical`.
- [ ] 2. Implement preflight → ordered locks → commits → operational receipt; plain-text listing.
- [ ] 3. Run green.

**Done when:** Preflight prevents index-cap half-applies; expire/delete honesty holds; history/journal records accepts.
**Do NOT:** Bulk accept-all; auto-accept; mark proposal accepted before canonical commits complete.

### Task 8 — Installer + five adapters (`gcm init` / `--dry-run` / `--uninstall`)

**Goal:** One Node installer writes managed instruction fragments (fenced managed blocks with begin/end markers + content hash) into each harness's native instruction surface: Claude Code (`CLAUDE.md`/`~/.claude`), Antigravity, Codex (`AGENTS.md`), OpenCode, Cursor (`.cursor/rules`). A manifest records every touched file for byte-faithful uninstall. (Codex seat deltas: `--dry-run`, `--uninstall`; agy seat: single Node installer.)
**Files:** `src/adapters/types.ts`, `src/adapters/{claude-code,antigravity,codex,opencode,cursor}.ts`, `src/installer.ts`, `src/cli.ts` (wire `gcm init`), `test/installer.test.ts`
**Red-arm test first:** `installer.test.ts :: "init --dry-run against a sandbox home prints the full plan and writes zero bytes (treeHash of sandbox identical before/after)"`

- [ ] 1. Failing tests in a sandboxed fake-home (never the real `~` — the SETUP law: a test touching operator-real state false-passes/false-fails): (a) dry-run writes nothing, prints every file + action; (b) init writes managed blocks; pre-existing user content outside markers is byte-preserved; (c) init is idempotent (second run → no diff); (d) uninstall restores every touched file to its pre-init bytes (manifest stores pre-images) and removes the manifest; (e) a user-modified managed block is detected via content hash and init refuses to stomp it without `--force`, naming the file; (f) fragments contain the harness-correct instruction text telling the agent where memory lives and that writes go through `gcm`/MCP — one fragment source of truth rendered per adapter, so a rule edit cannot drift per-harness (summarising-a-rule law: parity test asserts each constraint sentence appears in all five rendered fragments verbatim).
- [ ] 2. Implement adapter contract + five adapters + manifest; detect-only mode for harnesses not installed (skip with label, never error).
- [ ] 3. Run green on win32 paths.

**Done when:** dry-run/init/idempotence/uninstall/tamper arms all pass; fragment parity test passes.
**Do NOT:** Auto-register MCP in harness configs without an explicit `--mcp` flag (Task 11); modify any file outside the manifest's recorded set; use shell scripts.

### Task 9 — `gcm doctor`

**Goal:** One diagnostic surface: store integrity (every memory file parses; every MEMORY.md line resolves; revisions/sidecars consistent), cap headroom, adapter install state, per-harness corpus availability **with partial labels for agy/OpenCode**, and secret-scanner self-test execution (the guard proves it can fire, every run).
**Files:** `src/doctor.ts`, `src/cli.ts` (wire), `test/doctor.test.ts`
**Red-arm test first:** `doctor.test.ts :: "doctor on a store with a seeded dangling MEMORY.md entry and a corrupt frontmatter file reports both by path and exits non-zero"`

- [ ] 1. Failing tests: (a) seeded corruption (dangling index line, bad frontmatter, orphaned revision sidecar) each reported by path; (b) **control:** healthy fixture store → exit 0, and the report *names the checks that ran with counts* (`memories: 12 checked`) so an empty store reads `memories: 0 — EMPTY, proves nothing`, never a clean bill (zero-label law); (c) corpus section shows scanned-path + count per harness and `PARTIAL` labels for agy/OpenCode; (d) doctor never writes (tree-hash identical arm).
- [ ] 2. Implement; run green.

**Done when:** Bidirectional (catches seeded faults, passes healthy, labels empty); read-only proven.
**Do NOT:** Auto-fix anything (report + suggested command only); hide a check that couldn't run — `COULD_NOT_MEASURE` is its own labeled status, distinct from pass and fail.

### Task 10 — `gcm export` / `gcm import` (portability)

**Goal:** Round-trippable portability (copilot seat delta; fable-audit "portability API" guardrail): export = tarball (or zip via Node built-ins/`tar` pure-JS dep) of memory files + revisions + config + proposals; import replays memory files through `commit()` (so secret scan + caps + CAS gate imported content too).
**Files:** `src/portability.ts`, `src/cli.ts` (wire), `test/portability.test.ts`
**Red-arm test first:** `portability.test.ts :: "export → wipe → import yields memoryTreeHash equality; import of an archive containing a planted secret is rejected file-by-file with the store left consistent"`

- [ ] 1. Failing tests: (a) round-trip hash equality on memory files + index regeneration; (b) secret-bearing archive entry rejected (proves import uses the sole write path, not a raw unpack); (c) import into a non-empty store requires `--merge` or `--replace`, refuses otherwise with both options named; (d) partial-failure report lists imported/rejected/skipped counts (durable receipt, nothing silently dropped).
- [ ] 2. Implement; run green.

**Done when:** All arms pass; import path provably routes through `commit()` (guard: the AST no-write guard from Task 1 already forbids the alternative — assert portability.ts has zero direct write sites).
**Do NOT:** Export harness credentials or transcripts (memory plane only); invent a custom binary format.

### Task 11 — Optional shared MCP server (read + commit-mediated write)

**Goal:** `gcm mcp` serves the store over MCP for harnesses that register MCP servers (CHAIRMAN resolution: file mounts for all five are primary and dream works without MCP; MCP is additive). Tools: `memory_search`, `memory_read`, `memory_commit` (delegates to `MemoryStore.commit()` with CAS + all gates), `memory_propose` (writes a proposal for HITL instead of committing). Installer gains `--mcp` to register it per harness.
**Files:** `src/mcp/server.ts`, `src/installer.ts` (`--mcp` registration per adapter), `test/mcp.test.ts`
**Red-arm test first:** `mcp.test.ts :: "memory_commit over MCP with stale base_hash returns CasConflict error payload and store is byte-identical"`

- [ ] 1. Failing tests (drive the server in-process over stdio transport): (a) stale-CAS arm as above with control (fresh hash succeeds); (b) `memory_commit` with a planted secret is rejected (gates reachable through MCP — the guard is scoped to *every* consumer, and MCP is a new consumer of the commit gate; enumerate-the-consumers law); (c) `memory_search`/`memory_read` never write (tree-hash arm); (d) server refuses to start against a nonexistent store with valid-options guidance.
- [ ] 2. Implement with `@modelcontextprotocol/sdk`; run green.
- [ ] 3. Extend installer tests: `--mcp` registers in each harness's MCP config where one exists, recorded in the manifest, removed on uninstall.

**Done when:** All gates demonstrably active through the MCP consumer; uninstall removes registration byte-faithfully.
**Do NOT:** Add an MCP tool that bypasses `commit()`; make MCP required for any v1 flow; start the server from any adapter fragment automatically.

### Task 12 — Dream-policy steering + docs honesty pass + release gate

**Goal:** Config-driven steering of what dreaming looks for (`dream.policy`: focus topics, exclude globs, max proposals per run, per-source enable) — policy shapes *proposals only*, never writes. Plus the honesty documentation and the final cross-platform release gate.
**Files:** `src/dream/policy.ts`, `src/dream/run.ts` (consume policy), `docs/HONESTY.md`, `README.md`, `test/dream.test.ts` (extend), CI workflow file
**Red-arm test first:** `dream.test.ts :: "policy excluding source 'cursor' yields zero cursor-evidenced proposals while the control run without the exclusion yields ≥1 from the same fixture corpus"`

- [ ] 1. Failing tests: (a) exclusion arm + control as above; (b) `max_proposals` cap enforced with dropped candidates **logged in the run report**; (c) policy schema rejects `dream.schedule`/`dream.auto` keys by name in v1; (d) **memory.policy in adapters:** an exclusion string configured in `memory.policy` appears **verbatim** in all five rendered adapter fragments (bidirectional: remove it → fragments lack it).
- [ ] 2. Write `docs/HONESTY.md` + README: adapter matrix, HITL-only claim (explicit: no `memory_dream` auto-supersede parity), caps, CAS, `memoryTreeHash` definition, human-edit reconciliation, uninstall guarantee. Parity check: every Global Constraint appears in docs.
- [ ] 3. Release gate: full `vitest` suite green on ubuntu + windows + macos CI matrix, **tools + `@modelcontextprotocol/sdk` pinned to the lockfile in every workflow**; `npm pack` + install into a throwaway dir + `gcm doctor` smoke on all three OSes.
- [ ] 4. Run green; tag `v1.0.0` only after CEO publish gate.

**Done when:** Policy arms discriminate; fragment steering oracle passes; docs parity check passes; CI matrix green from a clean checkout.
**Do NOT:** Add a daemon, scheduler, or watcher (v1.1+, and even then queue-only); publish to npm without the CEO's explicit go (public ship = CEO gate).

## Non-goals (v1)

- **No `memory_dream` auto-supersede parity** — no automatic fact reconciliation, no silent transcript→memory apply. Dreaming means HITL proposals, full stop.
- **No daemon/scheduler/watcher.** v1.1+ may add a daemon that only *queues* proposals via the same CLI code path — never a second write path.
- **No omega dependencies:** no omega-jarvis/orchestrator imports, no Telegram, voice, speaker-gate, `OMEGA_FACTS_DB`.
- **No SQLite** — not even as a cache in v1 (a rebuildable search cache is a possible v1.1 addition; never a second writable truth).
- **No org/team memory tier**, no Managed-Agents-API clone, no cloud sync.
- **No LLM-in-the-loop extraction requirement** — the deterministic pipeline stands alone; model-assisted candidate generation is a flagged v1.1 experiment.
- **No bulk accept-all** in review; no auto-registration of MCP without `--mcp`.
- **No claim of agy/OpenCode corpus support** until dogfood receipts exist; adapters yes, importers labeled `PARTIAL`.

## Audit trail

- Round 0: Fable draft (`PLAN_STATUS: READY_FOR_AUDIT`).
- Round 1: Thinktank 6/8 → APPROVE_WITH_FIXES; applied CE-8, expire/delete, memoryTreeHash, proposal secrets, etc.
- Round 2: Thinktank 5/8 → APPROVE_WITH_FIXES (1× APPROVE); applied sole-write-path store-owned ops, accept preflight, deterministic proposal ids, proper-lockfile + cross-process test, fixture-pinned importers, path containment, deleteCanonical, commit journal.

PLAN_STATUS: READY_FOR_REAUDIT
