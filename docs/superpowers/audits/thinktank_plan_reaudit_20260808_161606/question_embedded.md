
## FULL PLAN TEXT (authoritative for this re-audit)

# Gotcontext Memory Multi-Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `gotcontext-memory` — an installable Node/TypeScript package giving Claude Code, Antigravity (agy), Codex, OpenCode, and Cursor one disk-canonical markdown memory plane at `~/.gotcontext/` and/or `<project>/.gotcontext/`, with a single write API (`MemoryStore.commit()` — sha256 CAS, atomic rename, revision sidecars, secret scan, index caps) and an out-of-band **HITL transcript-dream loop** (corpus → `gcm dream` proposals → `gcm review` accept/reject). No omega dependencies.

**Architecture:** Locked **C — Hybrid** per `docs/thinktank_council_20260808_155453/CHAIRMAN_SYNTHESIS.md` (4/4 verdict seats). Disk-canonical markdown store; CLI-only dreaming in v1 (daemon is v1.1+ and may only *queue* proposals — never a second write path); adapters are managed instruction fragments for all five harnesses plus an optional shared MCP server; honesty boundary = parity with omega `transcript_dream` HITL only, never `memory_dream` auto-supersede (fable-audit CE honesty flags; `_dream_audit\fable-audit.md`).

**Tech Stack:** Node/TypeScript preferred (one cross-platform CLI). Node ≥ 22, ESM, `commander` for CLI, `vitest` for tests, `yaml` for frontmatter. No native modules; Windows + macOS + Linux from Node only (no bash-only installer). Optional SQLite appears **nowhere in v1** (codex seat: SQLite only ever as a rebuildable cache, and not in this version).

## Global Constraints

These are load-bearing; every task's tests must respect them. Sources: BRIEF constraints, CHAIRMAN_SYNTHESIS §Partial-Agreement resolutions, fable-audit CE-10..15 (guardrails: versioning+rollback+provenance, hash CAS, permission tiers, portability), `transcript-dream-hitl` SKILL.md (HITL contract), `_dream_audit\plan.md` / `research.md` (production failure modes: multi-writer, bad org-wide write, staleness, malicious injection), and `omega-jarvis\docs\superpowers\specs\2026-08-07-context-engineering-dreaming-design.md` (proposal/receipt shapes).

1. **Sole write path.** Every mutation of the memory tree goes through `MemoryStore.commit()`. No other module calls `fs.writeFile` under a store root. Enforced by a repo guard test (Task 1).
2. **CAS everywhere.** `commit()` takes `baseHash` (sha256 of the file's prior bytes, or the sentinel `"absent"` for a new file). Mismatch → typed `CasConflict` error, store byte-identical. Write is tempfile-in-same-dir → `fs.rename`. Prior bytes go to `revisions/<file>.<hash>.md` with a provenance sidecar (who/when/source/transcript-id) *before* the rename. **Per-target cross-process lock** serializes CAS validate → revision write → rename so two concurrent writers cannot both validate the same `baseHash` (exactly one wins; loser gets `CasConflict`).
3. **Fresh install never dreams unprompted.** No schedule, no hook, no post-install trigger. `dream.enabled` config defaults to a state that only affects future opt-in tooling; `gcm dream` runs only when a human invokes it. Default-OFF is a tested property, not a comment.
4. **Hash scopes are named and tested.** `memoryTreeHash(store)` hashes **only** canonical memory markdown files under `memory/` plus `MEMORY.md`. It **excludes** `proposals/`, `revisions/`, `receipts/`, `locks/`, tempfiles, and `config.json`. `storeTreeHash` (optional doctor aid) may cover more, but dream/review zero-write invariants use **`memoryTreeHash` only**. Controls: proposal-file change must **not** move `memoryTreeHash`; one-byte memory change must.
5. **Dream run leaves `memoryTreeHash` identical.** Proposals are written under `.gotcontext/proposals/` only. The dream command computes `memoryTreeHash` before and after and **fails its own run** if they differ. Proposal bodies+evidence are **secret-scanned before write**; findings → proposal withheld + labeled count in the run receipt (CE-12 leak class at dream-time, not only commit-time).
6. **Reject leaves `memoryTreeHash` identical; accept commits via the proposal's recorded `base_hash`** through `MemoryStore.commit()` — so a memory edited between dream-time and accept-time is a `CasConflict`, never a silent overwrite. Accept may also update operational paths (`revisions/`, `proposals/accepted|rejected/`, receipts) and must regenerate `MEMORY.md` via **pure** `regenerateIndex()` bytes committed through `commit()` (caps/secret/CAS apply).
7. **Empty corpus refuses with an explicit zero label.** `gcm dream` on zero *included* transcripts exits non-zero with `EMPTY_CORPUS — proves nothing; scanned=N included=0 excluded_permission=M …` — a measured-nothing zero must be distinguishable from "no proposals warranted" (workspace zero-label law).
8. **Permission-mirrored corpus (CE-8).** Dream/corpus selection filters transcripts to the target store's trust scope: project store → only that project's sessions; user store → only configured eligible scopes. Receipt fields `scanned`, `included`, `excluded_permission`, `malformed`, `emitted` must reconcile (`included + excluded_* + malformed accounting = scanned`). Bidirectional fixture: one in-scope + one out-of-scope transcript.
9. **No omega dependencies** in `package.json` or runtime imports (guard test, Task 1). No Telegram, voice, speaker-gate, `OMEGA_FACTS_DB`.
10. **Honesty labels.** agy/OpenCode ship adapters but their corpus importers are labeled `corpus: partial (no dogfood receipts)` in doctor/README until receipts exist. Docs claim only HITL-transcript-dream parity.
11. **Index caps.** `MEMORY.md` ≤ ~200 lines / 25KB; a commit that would exceed the cap is rejected with a typed error naming the overage, not truncated silently.
12. **Secret scan is a commit gate** (deny by default, allowlist by config), with a bidirectional self-test: a known-planted secret MUST be rejected before the scanner is trusted (broken-oracle trap). The gate is **never default-off**.
13. **Cross-platform paths.** All path handling via `node:path`; tests run on `win32` separators (CI matrix includes windows-latest). No `~` expansion outside one audited helper. Close tempfile handles before `rename` on win32 (`EBUSY` footgun).
14. **Staleness actions.** Proposal `action` enum is `create|update|supersede|expire|delete`. Accepted `expire` commits frontmatter/removal that drops the entry from subsequent `MEMORY.md` regeneration; `delete` is two-step (expire first unless `--yes-delete` on a named id).
15. **Human direct edits.** If a human edits a memory file outside `gcm`, the next `commit`/`dream` uses current on-disk bytes as the CAS base (no phantom cached hash). Documented in `docs/HONESTY.md`.

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
    store.ts                      # MemoryStore: commit() [per-target lock, CAS, tmp→rename, revision sidecar, secret gate, cap gate], read(), list(), history(), rollback()
    secrets.ts                    # secret patterns + scan(bytes) → findings; used by commit AND dream proposal write; self-test fixtures
    index.ts                      # regenerateIndex(store) PURE bytes only; caps enforced when those bytes are commit()'d
    config.ts                     # .gotcontext/config.json (dream.policy + memory.policy, allowlists, adapter state)
    corpus/
      types.ts                    # Transcript (+ tool_events, skill_invocations), CorpusSource.scan({scope}); scan/include/exclude counts
      claude.ts                   # Claude Code JSONL session importer (~/.claude/projects/**) with scope filter
      codex.ts                    # Codex session importer + scope filter
      cursor.ts                   # Cursor session importer + scope filter
      agy.ts                      # agy importer stub: enumerates candidates, labeled partial
      opencode.ts                 # OpenCode importer stub: labeled partial
    dream/
      run.ts                      # gcm dream: scoped corpus → extraction → secret-scanned proposals/*.json; memoryTreeHash invariant; empty-corpus refusal
      proposal.ts                 # Proposal schema {id, action: create|update|supersede|expire|delete, targetPath, base_hash, body, evidence[], expiry}
      policy.ts                   # dream.policy + memory.policy steering (focus/exclude, max proposals, sources)
    review.ts                     # gcm review: list/show/accept/reject; accept→commit(base_hash) incl. expire/delete; reject→memoryTreeHash identical
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

### Task 1 — Package scaffold + `MemoryStore.commit()` (CAS, atomic rename, revisions) + repo guards

**Goal:** The sole write path exists and is provably sole. (CHAIRMAN §Partial-Agreement: CAS + revision sidecars are v1-blocking, per fable CE-2/14/15.)
**Files:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/paths.ts`, `src/hash.ts`, `src/frontmatter.ts`, `src/store.ts`, `test/store.test.ts`, `test/guards.test.ts`
**Red-arm test first:** `store.test.ts :: "commit with stale baseHash throws CasConflict and leaves file bytes unchanged"`

- [ ] 1. Write failing tests: (a) stale-`baseHash` commit → `CasConflict`, target file byte-identical (capture bytes before/after); (b) **control arm** — correct `baseHash` commit succeeds and the *same assertion helper* detects the changed bytes (proves the byte-comparison instrument can fail); (c) new-file commit requires sentinel `"absent"`, and `"absent"` against an existing file conflicts; (d) prior bytes land in `revisions/` named by hash, with provenance sidecar (source, timestamp, transcript-id nullable); (e) `history()` lists revisions, `rollback(hash)` is itself a `commit()` (appears in revisions); (f) **two concurrent writers** on the same target: exactly one succeeds, loser gets `CasConflict`, final bytes equal the winner's body (lost-update forbidden); (g) `memoryTreeHash` ignores a written `proposals/x.json` and detects a one-byte change under `memory/`.
- [ ] 2. Write failing guard tests: `package.json` deps/optionalDeps contain no `omega*`/`telegram`/`pipecat` names; AST walk (TypeScript compiler API, **not grep** — grep counts docstrings) over `src/` asserts no `fs.writeFile`/`fs.rename`/`createWriteStream` call sites outside `store.ts` target paths under a store root. Guard ships with its own positive control: a fixture source string containing a violation must be flagged.
- [ ] 3. Run tests, confirm all fail for the right reason (missing symbols, not import typos — check signatures exist before trusting a red).
- [ ] 4. Implement `hash.ts` (`memoryTreeHash` include-set documented in code), `paths.ts`, `frontmatter.ts`, then `store.ts` commit: acquire per-target lock → read current bytes → verify `baseHash` → write tempfile in same directory (close handle before rename on win32) → copy prior to `revisions/` + sidecar → `fs.rename` → release lock. Same-dir tempfile is mandatory (cross-device rename fails on Windows).
- [ ] 5. Run tests to green; run once with `win32` path fixtures.

**Done when:** All arms pass; control arm demonstrably discriminates; concurrent-writer arm proves serialization; guard tests green with their positive controls red-capable.
**Do NOT:** Add secret scan or caps yet (next tasks); expose any write helper besides `commit()`; use `git` for versioning (revisions are store-native so non-git users get rollback).

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
- [ ] 3. Implement against real formats: Claude Code JSONL under `~/.claude/projects/<slug>/*.jsonl`; Codex and Cursor per their session-log formats — **read the actual installed layout on this machine and encode what is verified, not guessed**; where a format detail is unverifiable, the importer marks the field null and the fixture documents the gap. Include ≥1 non-code memory/transcript fixture (presentation/preference flavored).
- [ ] 4. Run green.

**Done when:** Three full importers pass positive + zero-label + malformed + skill-metadata + CE-8 scope arms; stubs carry honest partial labels.
**Do NOT:** Reach into harness config/credential files; claim agy/OpenCode corpus support anywhere user-facing; default-scope to “everything in the time window”.

### Task 6 — `gcm dream`: proposals only, zero writes, empty-corpus refusal

**Goal:** The dream run: corpus → candidate memory extraction → `proposals/*.json`, with the tree-hash-identical invariant self-enforced (HITL contract from `transcript-dream-hitl` SKILL.md; proposal shape per the 2026-08-07 context-engineering-dreaming spec).
**Files:** `src/dream/run.ts`, `src/dream/proposal.ts`, `src/cli.ts` (wire `gcm dream`), `test/dream.test.ts`
**Red-arm test first:** `dream.test.ts :: "dream over fixture corpus leaves memoryTreeHash byte-identical before vs after; control: a deliberately mis-wired writer variant is caught by the same assertion"`

- [ ] 1. Failing tests: (a) `memoryTreeHash` invariant with **control arm** — a test-only hook that writes one byte into `memory/` must make the run's own self-check fail non-zero; writing under `proposals/` must **not** move `memoryTreeHash`; (b) empty *included* corpus → exit non-zero, message contains `EMPTY_CORPUS` + `scanned/included/excluded_permission` (Global Constraints 7–8); (c) each proposal validates against schema: `{id, action: create|update|supersede|expire|delete, targetPath, base_hash, body, evidence: [{transcriptId, quote}], createdAt, expiresAt}` — a proposal with no evidence quote is invalid; (d) re-running dream is idempotent per corpus state; (e) proposals for an existing target embed that target's **current** hash at dream time; (f) **staleness arm:** corpus + existing memory with no incoming evidence for ≥ threshold yields ≥1 `expire` proposal naming the reason; (g) **CE-8 arm:** out-of-scope transcript excluded and counted; (h) **proposal secret arm:** planted credential in fixture transcript → zero proposal files contain it; withheld count ≥ 1 in receipt.
- [ ] 2. Implement extraction: v1 heuristic + structural extraction (corrections, stated preferences, repeated facts, contradictions, stale bullets) — deterministic, no LLM call required; optional `--model` flag later, **not** in this task. Run `scan()` over proposal body+evidence before write.
- [ ] 3. Wire `gcm dream` with `--source`, `--since`, `--max-proposals`, `--store`/`--scope`; run green.

**Done when:** All arms pass; the zero-write invariant is enforced by the command itself via `memoryTreeHash`; secrets never land in proposal files.
**Do NOT:** Write to MEMORY.md or any memory file; add any scheduling; call any network/LLM API; claim auto-supersede (`memory_dream`) behavior anywhere.

### Task 7 — `gcm review`: HITL accept/reject/expire with base_hash CAS

**Goal:** The human gate. List/show proposals with evidence quotes; accept commits through `MemoryStore.commit(base_hash)`; reject/expire never touch the store (Global Constraint 5).
**Files:** `src/review.ts`, `src/cli.ts` (wire `gcm review [list|show|accept|reject] <id>`), `test/review.test.ts`
**Red-arm test first:** `review.test.ts :: "reject leaves memoryTreeHash byte-identical; accept of create/update changes the declared canonical path set and leaves excluded operational paths accounted for"`

- [ ] 1. Failing tests: (a) reject → `memoryTreeHash` identical, proposal moved to `proposals/rejected/` with reason; (b) accept of `create|update|supersede` → canonical path set changes as declared (target memory file ± `MEMORY.md` via `regenerateIndex`→`commit`); operational paths (`revisions/`, `proposals/accepted/`, receipts) may change and are asserted by explicit allow-set, **not** “exactly one file”; (c) **stale-CAS arm:** edit the target after dream-time, then accept → `CasConflict` surfaced with re-dream guidance, `memoryTreeHash` unchanged; (d) accept of a `create` where the file now exists → conflict; (e) proposal-level `expiresAt` past → refuse accept, labeled; (f) accept of `expire` → commit updates target such that subsequent `regenerateIndex` omits it (end-to-end, not frontmatter-only); (g) `delete` without prior expire / without `--yes-delete` refuses; with `--yes-delete` on named id commits removal through `commit()`.
- [ ] 2. Implement; non-interactive flags (`--yes` / `--yes-delete` on a *named id only* — no bulk-accept-all in v1) plus plain-text listing suitable for any terminal.
- [ ] 3. Run green.

**Done when:** All arms pass; every accept is visible in `history()`; expire/delete honesty holds.
**Do NOT:** Add bulk accept-all; auto-accept on any condition; mutate proposals in place on accept (move to `proposals/accepted/` with the commit hash recorded — durable receipt).

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
- Round 1: Thinktank 6/8 → APPROVE_WITH_FIXES; chairman applied must-fixes above (`docs/superpowers/audits/thinktank_plan_audit_20260808_160928/CHAIRMAN_ROUND1.md`).

PLAN_STATUS: READY_FOR_REAUDIT
