# Codex implementation re-audit (round 3)

**RECOMMENDED: FAIL — Store-writer containment, review path validation, and CI release gates remain broken.**

OpenAI Codex v0.146.1
--------
workdir: C:\dev\projects\gotcontext-memory
model: gpt-5.6-sol
provider: openai
approval: never
sandbox: read-only
reasoning effort: none
reasoning summaries: none
session id: 019fe32b-e425-7d33-8000-9fbfd84f3228
--------
user
# Codex implementation RE-AUDIT — gotcontext-memory (round 3)

Answer inline. Do not dispatch other agents. Do not edit files.
Do NOT run node, sqlite, Format-Hex, or package installs. Read files only (type/Get-Content/findstr).
Do NOT treat the prior FAIL report as description of the CURRENT tree — it is historical.
Prefer the BUNDLE + INVENTORY in this audit folder when present.

End with exactly: `RECOMMENDED: PASS | PASS_WITH_FIXES | FAIL — <≤20 words>`

## Read (required)
1. Plan: `C:\dev\projects\gotcontext-memory\docs\superpowers\plans\2026-08-08-gotcontext-memory-multi-harness.md`
2. Bundle (current sources): `C:\dev\projects\gotcontext-memory\docs\superpowers\audits\codex_impl_audit_20260808_165851\BUNDLE.md`
3. Inventory: `C:\dev\projects\gotcontext-memory\docs\superpowers\audits\codex_impl_audit_20260808_165851\INVENTORY.md`
4. Honesty: `C:\dev\projects\gotcontext-memory\docs\HONESTY.md`
5. Spot-check any cited path under `src/` / `test/` if bundle truncated.

Also available WSL: `/mnt/c/dev/projects/gotcontext-memory/`

## Measured ground truth
- npm test: **47 passed / 11 files**
- version **0.9.0**
- Prior CRITICAL items claimed fixed: accept preflight+rollback-on-index-fail; proposal remove on accept; expire via frontmatter; path containment+symlink walk; secrets allowlist from config; doctor/portability/mcp/policy/CI; codex/cursor independent importers; uninstall preImageBase64

## Deliverable
For Tasks 1–12: DONE/PARTIAL/MISSING with file:line.
### Blocking defects (only if still open)
### Important gaps
### Honesty risks
### Test oracle gaps

PASS = no CRITICAL/HIGH blocking defects vs plan Tasks 1–12 core gates.
PASS_WITH_FIXES = core gates hold; list must-fix polish.
FAIL = prior CRITICAL/HIGH classes still open.

Final line: `RECOMMENDED: ...`

warning: Skill descriptions were shortened to fit the 2% skills context budget. Codex can still see every skill, but some descriptions are shorter. Disable unused skills or plugins to leave more room for the rest.
codex
I’ll perform a read-only re-audit against the current bundle/inventory, then spot-check only where evidence is incomplete. I’ll follow your command restrictions and won’t delegate.
codex
I’m using the `codebase-audit` skill because this is an implementation gate review; it will structure the evidence and severity assessment without changing scope.
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'C:\\Users\\oimir\\.agents\\skills\\codebase-audit\\SKILL.md' -Raw" in C:\dev\projects\gotcontext-memory
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'C:\\dev\\projects\\gotcontext-memory\\docs\\superpowers\\plans\\2026-08-08-gotcontext-memory-multi-harness.md' -Raw" in C:\dev\projects\gotcontext-memory
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'C:\\dev\\projects\\gotcontext-memory\\docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\BUNDLE.md' -Raw" in C:\dev\projects\gotcontext-memory
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'C:\\dev\\projects\\gotcontext-memory\\docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\INVENTORY.md' -Raw" in C:\dev\projects\gotcontext-memory
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'C:\\dev\\projects\\gotcontext-memory\\docs\\HONESTY.md' -Raw" in C:\dev\projects\gotcontext-memory
 succeeded in 944ms:
---
name: codebase-audit
description: "Use when asked to investigate, deep-dive, audit, review, or assess a codebase/repo/project for bugs, issues, security gaps, infrastructure risks, optimization opportunities, or unwired/dead/partially-implemented code. Triggers on \"investigate the X codebase\", \"audit/review the repo\", \"find bugs/security issues\", \"what's broken/risky in X\", \"dead code\", \"infra risks\", \"deep-dive the code\". READ-ONLY: produces a structured report, makes NO edits. This is the code/security/infra analog of frontend-audit (which is visual-only)."
---

# Codebase Audit Skill

Run a **read-only**, token-disciplined deep-dive of a codebase and produce ONE structured
report — bugs, security gaps, infrastructure risks, unwired/dead/partial code, and
optimizations — each finding ranked by severity and cited to `file:line` or the grep
pattern that surfaced it. **Security and infrastructure are the highest-priority areas
unless the caller says otherwise.**

The goal is **maximum insight per token**, not a file-by-file recital. The efficiency rules
below are load-bearing — applied ruthlessly, they let one pass cover a large repo without
blowing the budget. (Phase-2 claude-code hooks enforce rules 1 & 3 mechanically; until then
they are a hard discipline you self-enforce.)

## When to use
- "investigate / deep-dive / audit / review the <project> codebase"
- "find bugs / security issues / infra risks / dead code in <repo>"
- "what's broken, risky, or half-finished here?"
- Pre-merge or pre-handoff assessment of an unfamiliar repo.

## When NOT to use
- **Making the fixes** — this skill only REPORTS. Hand findings to an implement loop after.
- **Visual/UX/CRO review** — use `frontend-audit`.
- **A single known bug** — just debug it; don't audit the whole repo.

## Inputs / parameters
- **repo** (required): the working directory to audit (the agent runs IN this cwd).
- **focus** (optional): risk areas to emphasize (default: all five categories).
- **priority** (optional): which categories rank highest (default: Security, Infrastructure).
- Always **read-only**. Never edit, never run mutating commands.

## RULE 1 — Token discipline (HIGHEST priority)
- **Never read the same file twice.** Track what you've read; if you feel the urge to
  re-open a file, STOP and synthesize from what you already have.
- **Never read build/generated dirs:** node_modules, .next, dist, build, __pycache__,
  .pytest_cache, .venv, vendor, target, coverage, lockfile internals.
- **Prefer Grep (with head_limit) and Glob over listing a directory + reading files.**
- When you do read a file, use offset + limit — read the relevant span, not the whole file,
  unless it is genuinely small or you genuinely need all of it.
- **Read CLAUDE.md / SKILLS-INDEX.md / README.md for a directory FIRST** — they often
  replace opening a dozen source files.

## RULE 2 — Strategy (follow this order)
1. **Root config + governance only, first:** the deploy/runtime/dependency manifests for the
   stack (Dockerfile, docker-compose.yml, fly.toml, vercel.json, requirements.txt /
   pyproject.toml, package.json, CI workflows) + every CLAUDE.md. These define the attack
   surface, the infra, and the conventions in a handful of reads.
2. **Broad Grep sweeps for the risk areas** (see RULE 4's pattern bank) — security, infra,
   TODO/FIXME/HACK, unwired features, silent-failure patterns, auth/rate-limit/webhook gaps.
   Let the grep hits point you to high-signal files.
3. **Drill into a specific file ONLY when grep or a CLAUDE.md flags it** as high-signal.
4. **Any directory with >20 files -> Grep/Glob first.** Never list-and-read-everything.

## RULE 3 — Anti-waste hard constraints
- Do **not** list or walk generated/build dirs (RULE 1's list).
- Do **not** re-read a file you have already read, even when a "different" angle tempts you.
- Do **not** run the full test suite, builds, installs, or anything mutating — read-only.
- If grep already answered the question, do **not** open the file to "confirm."

## RULE 4 — Risk pattern bank (grep starting points; adapt to the stack)
- **Security:** code-eval / dynamic-exec calls, pickle/deserialization, subprocess or
  child_process with shell enabled, dangerouslySetInnerHTML, raw SQL string concatenation,
  TLS verification disabled, hardcoded secret|token|api[_-]?key|password, non-constant-time
  token compares, permissive CORS `*`, routes missing auth/middleware, JWT alg:none.
- **Infrastructure:** unpinned deps / `latest` tags, 0.0.0.0 binds, missing healthchecks, no
  resource limits, secrets committed in env files, single-replica stateful services, missing
  retries/timeouts on outbound calls, unbounded queues/caches (OOM), missing rate limits.
- **Unwired / dead / partial:** TODO|FIXME|HACK|XXX|WIP|"not implemented"|stub|placeholder,
  exported symbols with zero importers, routes defined but never registered, feature flags
  that gate nothing, env vars read-but-never-set (or set-but-never-read).
- **Silent failures:** bare except / except Exception: pass, empty catch blocks, swallowed
  promise rejections, ignored return codes, blanket lint-disable, error logged-not-raised.
- **Bugs:** off-by-one, missing await, mutable default args, races on shared state,
  unhandled None/undefined, resource leaks (unclosed files/connections).

## RULE 5 — Output contract
Produce **ONE final structured report** at the end. **No running commentary, no file-by-file
narration, no "reading X..." play-by-play.** Organize by category, severity-ranked within:

    # Codebase Audit — <repo>   (read-only; no edits made)

    ## Security            [highest priority]
    - [CRITICAL] <finding> — path/file.py:120-134   (or: surfaced by grep <pattern>)
    - [HIGH] ...
    ## Infrastructure      [highest priority]
    ## Bugs & Issues
    ## Unwired / Dead / Partial Code
    ## Optimizations

    ## Summary
    - N findings: X critical, Y high, Z medium. Top 3 to fix first: ...
    - Coverage note: what was sampled vs exhaustively read (be honest about gaps).

Severities: **CRITICAL** (exploitable / data-loss / outage), **HIGH**, **MEDIUM**, **LOW**.
Every finding MUST cite file:line-range OR the grep pattern that surfaced it. No finding
without evidence — if you cannot cite it, you did not verify it; drop it or mark it
UNVERIFIED and say which read would confirm it.

## Ultrathink, but ruthlessly efficient
Think hard about systemic risk and what the code is *not* doing — but obey RULES 1 & 3
without exception. A re-read or a node_modules walk is a budget leak; the discipline IS the
skill. Maximum insight per token.


 succeeded in 945ms:
# Gotcontext Memory Multi-Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `gotcontext-memory` — an installable Node/TypeScript package giving Claude Code, Antigravity (agy), Codex, OpenCode, and Cursor one disk-canonical markdown memory plane at `~/.gotcontext/` and/or `<project>/.gotcontext/`, with a single write API (`MemoryStore.commitCanonical()` — sha256 CAS, atomic rename, revision sidecars, secret scan, index caps) and an out-of-band **HITL transcript-dream loop** (corpus → `gcm dream` proposals → `gcm review` accept/reject). No omega dependencies.

**Architecture:** Locked **C — Hybrid** per `docs/thinktank_council_20260808_155453/CHAIRMAN_SYNTHESIS.md` (4/4 verdict seats). Disk-canonical markdown store; CLI-only dreaming in v1 (daemon is v1.1+ and may only *queue* proposals — never a second write path); adapters are managed instruction fragments for all five harnesses plus an optional shared MCP server; honesty boundary = parity with omega `transcript_dream` HITL only, never `memory_dream` auto-supersede (fable-audit CE honesty flags; `_dream_audit\fable-audit.md`).

**Tech Stack:** Node/TypeScript (one cross-platform CLI). Node ≥ 22.5, ESM, `commander`, `vitest`, `yaml`, pinned `proper-lockfile`. No native addons. Primary bin name **`gotcontext-memory`** (avoid `gcm` collision with Git Credential Manager on Windows; optional `gcm` alias documented as conflict-prone). Read-only `node:sqlite` allowed only for foreign corpus import (Cursor). Windows + macOS + Linux from Node only.

## Global Constraints

These are load-bearing; every task's tests must respect them. Sources: BRIEF constraints, CHAIRMAN_SYNTHESIS §Partial-Agreement resolutions, fable-audit CE-10..15 (guardrails: versioning+rollback+provenance, hash CAS, permission tiers, portability), `transcript-dream-hitl` SKILL.md (HITL contract), `_dream_audit\plan.md` / `research.md` (production failure modes: multi-writer, bad org-wide write, staleness, malicious injection), and `omega-jarvis\docs\superpowers\specs\2026-08-07-context-engineering-dreaming-design.md` (proposal/receipt shapes).

1. **Sole store-root mutation path = `store.ts`.** Every filesystem mutation under a `.gotcontext` store root (canonical memory, MEMORY.md, proposals, receipts, locks, revisions, config) goes through `MemoryStore` methods in `src/store.ts` only. Canonical path: `commitCanonical()` (CAS + secret scan + caps + revisions + commit journal). Operational path: `commitOperational()` (atomic write/move for proposals/receipts/config/locks; secret scan on proposal bodies; no MEMORY.md caps). Typed `deleteCanonical(path, baseHash)` captures prior bytes into revisions + journal, then removes/tombstones. The AST guard asserts **zero** `fs.writeFile`/`writeFileSync`/`rename`/`renameSync`/`unlink`/`rm`/`createWriteStream` call sites in any `src/**` module except `store.ts` (and `installer.ts` only for **non-store** adapter files).  Positive-control fixture is an in-memory source string, not a real violating file in `src/`. `installer.ts` must not write under a store root: store bootstrap uses `MemoryStore.initStore()`; uninstall manifest is either outside the store or written via `commitOperational`. `portability.ts` may write **only** to an explicit external archive path (never a store root) — AST allowlist + tests. `commitCanonical` used under an open `withCanonicalLocks(paths, fn)` session must use lock-aware internals (no nested lock acquire) to prevent deadlock. `regenerateIndex(store, { upserts, deletes })` is pure and models the post-accept state for preflight.
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
**Cursor corpus:** use read-only `node:sqlite` against fixture-pinned `state.vscdb` samples (no `better-sqlite3`).
**Do NOT:** Reach into harness config/credential files; claim agy/OpenCode corpus support anywhere user-facing; default-scope to “everything in the time window”; add native SQLite addons.

### Task 6 — `gcm dream`: proposals only (zero *canonical* writes), empty-corpus refusal

**Goal:** Corpus → extraction → operational proposals via `commitOperational` only. **Zero canonical-memory mutations** (`memoryTreeHash` identical). Operational proposal writes are expected and allowed.
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
- [ ] 2. Implement `withCanonicalLocks` session: preflight via `regenerateIndex(store, { upserts, deletes })` → `commitCanonicalLocked` × N → operational receipt; plain-text listing.
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
- [ ] 4. Runtime arm: `init` against sandbox with pre-existing store leaves that store's tree byte-identical (store bootstrap only via `MemoryStore.initStore()`; manifest via `commitOperational` or path outside store).
**Do NOT:** Auto-register MCP without `--mcp`; write store roots from installer-local `fs`; use shell scripts; primary-advertise the `gcm` bin on Windows without the Git Credential Manager collision warning.

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
**Do NOT:** Export harness credentials or transcripts; invent a custom binary format; unpack/write archives into a store root (archive writer is external-path-only; tested).

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
- **No SQLite as a gotcontext store or writable cache in v1.** Read-only use of Node built-in `node:sqlite` (no native addons) is permitted solely to import foreign harness corpora (e.g. Cursor `state.vscdb`). Never a second writable truth.
- **No org/team memory tier**, no Managed-Agents-API clone, no cloud sync.
- **No LLM-in-the-loop extraction requirement** — the deterministic pipeline stands alone; model-assisted candidate generation is a flagged v1.1 experiment.
- **No bulk accept-all** in review; no auto-registration of MCP without `--mcp`.
- **No claim of agy/OpenCode corpus support** until dogfood receipts exist; adapters yes, importers labeled `PARTIAL`.

## Audit trail

- Round 0: Fable draft (`PLAN_STATUS: READY_FOR_AUDIT`).
- Round 1: Thinktank 6/8 → APPROVE_WITH_FIXES; applied CE-8, expire/delete, memoryTreeHash, proposal secrets, etc.
- Round 2: Thinktank 5/8 → APPROVE_WITH_FIXES (1× APPROVE); applied sole-write-path store-owned ops, accept preflight, deterministic proposal ids, proper-lockfile + cross-process test, fixture-pinned importers, path containment, deleteCanonical, commit journal.

- Round 3: Thinktank APPROVE_WITH_FIXES (installer/runtime store arm, node:sqlite corpus, lock-session API, index overlay preflight, portability allowlist, bin naming); applied in-plan.

PLAN_STATUS: APPROVED


 succeeded in 1310ms:
### FILE src/review.ts
```
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { regenerateIndex } from "./index.js";
import type { Proposal } from "./dream/run.js";
import { scan, SecretDetected } from "./secrets.js";
import {
  BASE_ABSENT,
  checkIndexCaps,
  MemoryStore,
} from "./store.js";

export async function listProposals(store: MemoryStore): Promise<Proposal[]> {
  const dir = path.join(store.root, "proposals");
  const ents = await readdir(dir);
  const out: Proposal[] = [];
  for (const name of ents) {
    if (!name.endsWith(".json")) continue;
    const raw = await readFile(path.join(dir, name), "utf8");
    out.push(JSON.parse(raw) as Proposal);
  }
  return out;
}

export async function rejectProposal(
  store: MemoryStore,
  id: string,
  reason: string,
): Promise<void> {
  const before = await store.memoryTreeHash();
  const raw = await readFile(
    path.join(store.root, "proposals", `${id}.json`),
    "utf8",
  );
  await store.commitOperational({
    relativePath: `proposals/rejected/${id}.json`,
    body: JSON.stringify({ ...JSON.parse(raw), reason }, null, 2) + "\n",
    scanSecrets: false,
  });
  await store.removeOperational(`proposals/${id}.json`);
  const after = await store.memoryTreeHash();
  if (after !== before) throw new Error("reject mutated memoryTreeHash");
}

export async function acceptProposal(
  store: MemoryStore,
  id: string,
  opts: { yesDelete?: boolean } = {},
): Promise<void> {
  const rel = `proposals/${id}.json`;
  const raw = await readFile(path.join(store.root, rel), "utf8");
  const proposal = JSON.parse(raw) as Proposal;

  if (!proposal.targetPath || !proposal.action || !proposal.base_hash) {
    throw new Error("invalid proposal schema");
  }
  if (proposal.expiresAt && Date.parse(proposal.expiresAt) < Date.now()) {
    throw new Error(`proposal expired: ${id}`);
  }
  if (proposal.action === "delete" && !opts.yesDelete) {
    throw new Error("delete requires --yes-delete on a named id");
  }

  const overlayUpserts: Record<string, string> = {};
  const overlayDeletes: string[] = [];
  let expireBody: string | null = null;

  if (
    proposal.action === "create" ||
    proposal.action === "update" ||
    proposal.action === "supersede"
  ) {
    overlayUpserts[proposal.targetPath] = proposal.body;
  } else if (proposal.action === "expire") {
    const existing = await store.read(proposal.targetPath);
    if (!existing) throw new Error(`expire target missing: ${proposal.targetPath}`);
    const { frontmatter, body } = parseFrontmatter(existing.toString("utf8"));
    frontmatter.expires = new Date().toISOString();
    expireBody = serializeFrontmatter(frontmatter, body);
    overlayUpserts[proposal.targetPath] = expireBody;
  } else if (proposal.action === "delete") {
    overlayDeletes.push(proposal.targetPath);
  }

  const indexBytes = await regenerateIndex(store, {
    upserts: overlayUpserts,
    deletes: overlayDeletes,
  });

  // Preflight: secrets + caps before any canonical mutation
  const targetBody =
    expireBody ??
    overlayUpserts[proposal.targetPath] ??
    proposal.body;
  if (proposal.action !== "delete") {
    const findings = scan(targetBody, store.getSecretAllowlist());
    if (findings.length) throw new SecretDetected(findings);
  }
  try {
    checkIndexCaps(indexBytes);
  } catch (err) {
    throw err;
  }
  const indexFindings = scan(indexBytes, store.getSecretAllowlist());
  if (indexFindings.length) throw new SecretDetected(indexFindings);

  try {
    await store.withCanonicalLocks(
      [proposal.targetPath, "MEMORY.md"],
      async (locked) => {
        const targetBefore = await store.read(proposal.targetPath);
        const targetBeforeHash = targetBefore
          ? (await import("./hash.js")).sha256Hex(targetBefore)
          : BASE_ABSENT;

        if (proposal.action === "delete") {
          const base =
            proposal.base_hash === "absent"
              ? BASE_ABSENT
              : proposal.base_hash;
          await locked.deleteCanonicalLocked({
            relativePath: proposal.targetPath,
            baseHash: base,
            provenance: { authored_by: "dream", proposal_id: id },
          });
        } else if (proposal.action === "expire") {
          await locked.commitCanonicalLocked({
            relativePath: proposal.targetPath,
            body: expireBody!,
            baseHash: proposal.base_hash,
            provenance: {
              authored_by: "dream",
              proposal_id: id,
              source: "expire",
            },
          });
        } else {
          await locked.commitCanonicalLocked({
            relativePath: proposal.targetPath,
            body: proposal.body,
            baseHash: proposal.base_hash,
            provenance: { authored_by: "dream", proposal_id: id },
          });
        }
        try {
          const indexHash = await store.currentHash("MEMORY.md");
          await locked.commitCanonicalLocked({
            relativePath: "MEMORY.md",
            body: indexBytes,
            baseHash: indexHash,
            provenance: { authored_by: "system", proposal_id: id },
          });
        } catch (indexErr) {
          // Roll back target so accept never leaves half-applied canonical state.
          const { sha256Hex } = await import("./hash.js");
          if (proposal.action === "delete") {
            if (targetBefore) {
              await locked.commitCanonicalLocked({
                relativePath: proposal.targetPath,
                body: targetBefore.toString("utf8"),
                baseHash: BASE_ABSENT,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            }
          } else {
            const cur = await store.currentHash(proposal.targetPath);
            if (targetBefore) {
              await locked.commitCanonicalLocked({
                relativePath: proposal.targetPath,
                body: targetBefore.toString("utf8"),
                baseHash: cur,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            } else {
              await locked.deleteCanonicalLocked({
                relativePath: proposal.targetPath,
                baseHash: cur,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            }
          }
          void targetBeforeHash;
          void sha256Hex;
          throw indexErr;
        }
      },
    );
  } catch (err) {
    await store.commitOperational({
      relativePath: `receipts/${id}.error.json`,
      body:
        JSON.stringify({
          id,
          status: "error",
          code: "INDEX_DRIFT_OR_CAS",
          message: (err as Error).message,
          at: new Date().toISOString(),
        }) + "\n",
      scanSecrets: false,
    });
    throw err;
  }

  await store.commitOperational({
    relativePath: `proposals/accepted/${id}.json`,
    body: raw,
    scanSecrets: false,
  });
  await store.removeOperational(`proposals/${id}.json`);
  await store.commitOperational({
    relativePath: `receipts/${id}.json`,
    body:
      JSON.stringify({
        id,
        status: "accepted",
        at: new Date().toISOString(),
      }) + "\n",
    scanSecrets: false,
  });
}

```

### FILE src/store.ts
```
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import { defaultConfigJson, loadConfig } from "./config.js";
import { fileExists, memoryTreeHash, sha256Hex } from "./hash.js";
import {
  assertSafeRelativePath,
  resolveUnderStore,
  resolveUnderStoreSync,
} from "./paths.js";
import { scan, SecretDetected } from "./secrets.js";

export class CasConflict extends Error {
  currentHash: string;
  constructor(currentHash: string) {
    super(`CasConflict: expected baseHash mismatch; current=${currentHash}`);
    this.name = "CasConflict";
    this.currentHash = currentHash;
  }
}

export class IndexCapExceeded extends Error {
  constructor(
    public lines: number,
    public bytes: number,
    public lineCap: number,
    public byteCap: number,
  ) {
    super(
      `IndexCapExceeded: lines=${lines}/${lineCap} bytes=${bytes}/${byteCap}`,
    );
    this.name = "IndexCapExceeded";
  }
}

export type CommitProvenance = {
  authored_by: "dream" | "agent" | "human" | "system";
  source?: string;
  transcript_id?: string | null;
  proposal_id?: string;
};

export const LINE_CAP = 200;
export const BYTE_CAP = 25 * 1024;
export const BASE_ABSENT = "absent";

function assertCanonicalRel(rel: string): void {
  if (!(rel === "MEMORY.md" || rel.startsWith("memory/"))) {
    throw new Error(`Canonical path required, got ${rel}`);
  }
}

export function checkIndexCaps(body: string): void {
  const lines = body.split(/\r?\n/).length;
  const bytes = Buffer.byteLength(body, "utf8");
  if (lines > LINE_CAP || bytes > BYTE_CAP) {
    throw new IndexCapExceeded(lines, bytes, LINE_CAP, BYTE_CAP);
  }
}

export class MemoryStore {
  private allowlist: string[] = [];

  constructor(public readonly root: string) {}

  static async initStore(root: string): Promise<MemoryStore> {
    await mkdir(path.join(root, "memory"), { recursive: true });
    await mkdir(path.join(root, "proposals"), { recursive: true });
    await mkdir(path.join(root, "proposals", "accepted"), { recursive: true });
    await mkdir(path.join(root, "proposals", "rejected"), { recursive: true });
    await mkdir(path.join(root, "revisions"), { recursive: true });
    await mkdir(path.join(root, "receipts"), { recursive: true });
    await mkdir(path.join(root, "locks"), { recursive: true });
    const index = path.join(root, "MEMORY.md");
    if (!(await fileExists(index))) {
      await writeFile(index, "# Memory index\n\n", "utf8");
    }
    const cfgPath = path.join(root, "config.json");
    if (!(await fileExists(cfgPath))) {
      await writeFile(cfgPath, defaultConfigJson(), "utf8");
    }
    const store = new MemoryStore(root);
    await store.reloadConfig();
    return store;
  }

  async reloadConfig(): Promise<void> {
    const cfg = await loadConfig(this.root);
    this.allowlist = cfg.secrets.allowlist;
  }

  getSecretAllowlist(): string[] {
    return [...this.allowlist];
  }

  async memoryTreeHash(): Promise<string> {
    return memoryTreeHash(this.root);
  }

  async withCanonicalLocks<T>(
    relPaths: string[],
    fn: (locked: LockedStore) => Promise<T>,
  ): Promise<T> {
    const sorted = [...new Set(relPaths.map((p) => p.replace(/\\/g, "/")))].sort();
    const releases: Array<() => Promise<void>> = [];
    try {
      for (const rel of sorted) {
        // Containment before canonical predicate so traversal never reaches locks.
        assertSafeRelativePath(rel);
        if (!(rel === "MEMORY.md" || rel.startsWith("memory/"))) {
          throw new Error(`withCanonicalLocks only for canonical paths: ${rel}`);
        }
        const abs = await resolveUnderStore(this.root, rel);
        await mkdir(path.dirname(abs), { recursive: true });
        if (!(await fileExists(abs))) {
          const stub = path.join(
            this.root,
            "locks",
            `${sha256Hex(rel)}.lock`,
          );
          await writeFile(stub, "", { flag: "a" });
          const release = await lockfile.lock(stub, {
            retries: { retries: 10, minTimeout: 20, maxTimeout: 200 },
            stale: 10_000,
          });
          releases.push(release);
        } else {
          const release = await lockfile.lock(abs, {
            retries: { retries: 10, minTimeout: 20, maxTimeout: 200 },
            stale: 10_000,
          });
          releases.push(release);
        }
      }
      return await fn(new LockedStore(this));
    } finally {
      for (const release of releases.reverse()) {
        try {
          await release();
        } catch {
          /* ignore */
        }
      }
    }
  }

  async commitCanonical(opts: {
    relativePath: string;
    body: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<{ hash: string }> {
    return this.withCanonicalLocks([opts.relativePath], (locked) =>
      locked.commitCanonicalLocked(opts),
    );
  }

  async commitOperational(opts: {
    relativePath: string;
    body: string | Buffer;
    scanSecrets?: boolean;
  }): Promise<void> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    if (rel === "MEMORY.md" || rel.startsWith("memory/")) {
      throw new Error("Use commitCanonical for canonical memory paths");
    }
    const text =
      typeof opts.body === "string" ? opts.body : opts.body.toString("utf8");
    if (opts.scanSecrets !== false) {
      const findings = scan(text, this.allowlist);
      if (findings.length) throw new SecretDetected(findings);
    }
    const abs = await resolveUnderStore(this.root, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
    const fh = await open(tmp, "w");
    try {
      await fh.writeFile(opts.body);
      await fh.close();
      await rename(tmp, abs);
    } catch (err) {
      try {
        await fh.close();
      } catch {
        /* */
      }
      await rm(tmp, { force: true });
      throw err;
    }
  }

  async deleteCanonical(opts: {
    relativePath: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<void> {
    await this.withCanonicalLocks([opts.relativePath], async (locked) => {
      await locked.deleteCanonicalLocked(opts);
    });
  }

  async removeOperational(relativePath: string): Promise<void> {
    const rel = relativePath.replace(/\\/g, "/");
    if (rel === "MEMORY.md" || rel.startsWith("memory/")) {
      throw new Error("Use deleteCanonical for canonical paths");
    }
    const abs = await resolveUnderStore(this.root, rel);
    await rm(abs, { force: true });
  }

  async read(relativePath: string): Promise<Buffer | null> {
    const abs = await resolveUnderStore(this.root, relativePath);
    try {
      return await readFile(abs);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async currentHash(relativePath: string): Promise<string> {
    const buf = await this.read(relativePath);
    return buf ? sha256Hex(buf) : BASE_ABSENT;
  }

  async history(relativePath: string): Promise<
    Array<{ hash: string; path: string; meta?: Record<string, unknown> }>
  > {
    const revDir = path.join(this.root, "revisions");
    const prefix = relativePath.replace(/\//g, "__") + ".";
    const { readdir } = await import("node:fs/promises");
    let names: string[] = [];
    try {
      names = await readdir(revDir);
    } catch {
      return [];
    }
    const out = [];
    for (const name of names) {
      if (!name.startsWith(prefix) || !name.endsWith(".md")) continue;
      const hashPart = name.slice(prefix.length, -3);
      const metaPath = path.join(revDir, name.replace(/\.md$/, ".meta.json"));
      let meta: Record<string, unknown> | undefined;
      try {
        meta = JSON.parse(await readFile(metaPath, "utf8"));
      } catch {
        /* */
      }
      out.push({
        hash: hashPart,
        path: path.join(revDir, name),
        meta,
      });
    }
    return out;
  }

  async rollback(
    relativePath: string,
    revisionHashPrefix: string,
    provenance: CommitProvenance,
  ): Promise<void> {
    const hist = await this.history(relativePath);
    const hit = hist.find((h) => h.hash.startsWith(revisionHashPrefix));
    if (!hit) throw new Error(`revision not found: ${revisionHashPrefix}`);
    const body = await readFile(hit.path, "utf8");
    const base = await this.currentHash(relativePath);
    await this.commitCanonical({
      relativePath,
      body,
      baseHash: base,
      provenance: { ...provenance, source: `rollback:${revisionHashPrefix}` },
    });
  }
}

export class LockedStore {
  constructor(private readonly store: MemoryStore) {}

  async commitCanonicalLocked(opts: {
    relativePath: string;
    body: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<{ hash: string }> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    assertCanonicalRel(rel);
    const findings = scan(opts.body, this.store.getSecretAllowlist());
    if (findings.length) throw new SecretDetected(findings);
    if (rel === "MEMORY.md") checkIndexCaps(opts.body);

    const abs = await resolveUnderStore(this.store.root, rel);
    const existing = await this.store.read(rel);
    const currentHash = existing ? sha256Hex(existing) : BASE_ABSENT;
    if (currentHash !== opts.baseHash) {
      throw new CasConflict(currentHash);
    }

    if (existing) {
      const revDir = path.join(this.store.root, "revisions");
      await mkdir(revDir, { recursive: true });
      const stem = `${rel.replace(/\//g, "__")}.${currentHash.slice(0, 12)}`;
      await writeFile(path.join(revDir, `${stem}.md`), existing);
      await writeFile(
        path.join(revDir, `${stem}.meta.json`),
        JSON.stringify(
          {
            path: rel,
            hash: currentHash,
            at: new Date().toISOString(),
            provenance: opts.provenance,
            allowlist: this.store.getSecretAllowlist(),
          },
          null,
          2,
        ) + "\n",
      );
    }

    await mkdir(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
    const fh = await open(tmp, "w");
    try {
      await fh.writeFile(opts.body, "utf8");
      await fh.close();
      await rename(tmp, abs);
    } catch (err) {
      try {
        await fh.close();
      } catch {
        /* */
      }
      await rm(tmp, { force: true });
      throw err;
    }

    const hash = sha256Hex(opts.body);
    await appendJournal(this.store.root, {
      op: "commitCanonical",
      path: rel,
      baseHash: opts.baseHash,
      hash,
      at: new Date().toISOString(),
      provenance: opts.provenance,
      allowlist: this.store.getSecretAllowlist(),
    });
    return { hash };
  }

  async deleteCanonicalLocked(opts: {
    relativePath: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<void> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    assertCanonicalRel(rel);
    const existing = await this.store.read(rel);
    const currentHash = existing ? sha256Hex(existing) : BASE_ABSENT;
    if (currentHash !== opts.baseHash) throw new CasConflict(currentHash);
    if (!existing) return;
    const revDir = path.join(this.store.root, "revisions");
    await mkdir(revDir, { recursive: true });
    const stem = `${rel.replace(/\//g, "__")}.${currentHash.slice(0, 12)}`;
    await writeFile(path.join(revDir, `${stem}.md`), existing);
    await writeFile(
      path.join(revDir, `${stem}.meta.json`),
      JSON.stringify(
        {
          path: rel,
          hash: currentHash,
          at: new Date().toISOString(),
          provenance: opts.provenance,
          deleted: true,
        },
        null,
        2,
      ) + "\n",
    );
    const abs = await resolveUnderStore(this.store.root, rel);
    await rm(abs, { force: true });
    await appendJournal(this.store.root, {
 
…TRUNCATED…

```

### FILE src/installer.ts
```
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { adapters, MARK_BEGIN, MARK_END } from "./adapters/types.js";
import { loadConfig } from "./config.js";
import { memoryPolicyFragmentLines } from "./dream/policy.js";
import { fileExists, sha256Hex } from "./hash.js";

export type ManifestEntry = {
  adapter: string;
  path: string;
  /** sha256 of full file before managed upsert, or null if created */
  preImageHash: string | null;
  /** Full file bytes before upsert (base64), for byte-faithful uninstall */
  preImageBase64: string | null;
  blockHash: string;
};

export async function installFragments(opts: {
  dryRun?: boolean;
  cwd?: string;
  home?: string;
  storeHint: string;
  storeRoot?: string;
  force?: boolean;
}): Promise<{ planned: string[]; manifest: ManifestEntry[] }> {
  const cwd = opts.cwd ?? process.cwd();
  const home = opts.home ?? os.homedir();
  const planned: string[] = [];
  const manifest: ManifestEntry[] = [];
  const writtenThisRun = new Map<string, string>(); // absPath -> blockHash

  let policyLines: string[] = [];
  if (opts.storeRoot && (await fileExists(path.join(opts.storeRoot, "config.json")))) {
    const cfg = await loadConfig(opts.storeRoot);
    policyLines = memoryPolicyFragmentLines(cfg.memory.policy);
  }

  const norm = (s: string) => s.replace(/\r\n/g, "\n");

  for (const a of adapters) {
    if (!(await a.detect())) continue;
    const target = a.fragmentPath(home, cwd);
    const absTarget = path.resolve(target);
    // Installer must never write under a gotcontext store root
    if (opts.storeRoot) {
      const root = path.resolve(opts.storeRoot);
      if (absTarget === root || absTarget.startsWith(root + path.sep)) {
        throw new Error(`Installer refuses store-root target: ${target}`);
      }
    }
    planned.push(`${a.id}:${target}`);
    let fragment = a.render(opts.storeHint);
    if (policyLines.length) {
      fragment = fragment.replace(
        MARK_END,
        `${policyLines.join("\n")}\n${MARK_END}`,
      );
    }
    const blockHash = sha256Hex(norm(fragment));

    // Multiple adapters may share one path (agy + opencode → AGENTS.md)
    if (writtenThisRun.has(absTarget)) {
      if (writtenThisRun.get(absTarget) === blockHash) {
        manifest.push({
          adapter: a.id,
          path: target,
          preImageHash: null,
          preImageBase64: null,
          blockHash,
        });
        continue;
      }
      throw new Error(`Conflicting managed fragments for ${target}`);
    }

    let existing = "";
    if (await fileExists(target)) existing = await readFile(target, "utf8");
    const preImageHash = existing ? sha256Hex(existing) : null;
    const preImageBase64 = existing
      ? Buffer.from(existing, "utf8").toString("base64")
      : null;

    if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
      const start = existing.indexOf(MARK_BEGIN);
      const end = existing.indexOf(MARK_END) + MARK_END.length;
      const managed = existing.slice(start, end);
      if (norm(managed) !== norm(fragment) && !opts.force) {
        throw new Error(
          `Managed block tampered in ${target}; pass --force to overwrite`,
        );
      }
    }

    manifest.push({
      adapter: a.id,
      path: target,
      preImageHash,
      preImageBase64,
      blockHash,
    });
    writtenThisRun.set(absTarget, blockHash);
    if (opts.dryRun) continue;
    await mkdir(path.dirname(target), { recursive: true });
    const next = upsertManaged(existing, fragment);
    await writeFile(target, next, "utf8");
  }

  return { planned, manifest };
}

export async function uninstallFragments(opts: {
  storeRoot: string;
  force?: boolean;
}): Promise<string[]> {
  const manPath = path.join(opts.storeRoot, "installer-manifest.json");
  if (!(await fileExists(manPath))) {
    throw new Error("No installer-manifest.json — nothing to uninstall");
  }
  const man = JSON.parse(await readFile(manPath, "utf8")) as {
    entries: ManifestEntry[];
  };
  const restored: string[] = [];
  for (const e of man.entries) {
    if (e.preImageBase64 != null) {
      await writeFile(
        e.path,
        Buffer.from(e.preImageBase64, "base64").toString("utf8"),
        "utf8",
      );
    } else if (await fileExists(e.path)) {
      // File was created by us — remove managed block; if empty leftover, leave empty file
      const existing = await readFile(e.path, "utf8");
      if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
        const start = existing.indexOf(MARK_BEGIN);
        const end = existing.indexOf(MARK_END) + MARK_END.length;
        const without =
          (existing.slice(0, start) + existing.slice(end)).trimEnd() + "\n";
        await writeFile(e.path, without === "\n" ? "" : without, "utf8");
      }
    }
    restored.push(e.path);
  }
  await writeFile(
    manPath,
    JSON.stringify({
      entries: [],
      uninstalledAt: new Date().toISOString(),
    }) + "\n",
  );
  return restored;
}

function upsertManaged(existing: string, fragment: string): string {
  if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
    const start = existing.indexOf(MARK_BEGIN);
    const end = existing.indexOf(MARK_END) + MARK_END.length;
    return existing.slice(0, start) + fragment + existing.slice(end);
  }
  if (!existing.trim()) return fragment + "\n";
  return existing.replace(/\s*$/, "\n\n") + fragment + "\n";
}

```

### FILE src/portability.ts
```
import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip, gunzipSync } from "node:zlib";
import { regenerateIndex } from "./index.js";
import { assertSafeRelativePath } from "./paths.js";
import { BASE_ABSENT, MemoryStore } from "./store.js";

export async function exportStore(
  store: MemoryStore,
  destArchive: string,
): Promise<void> {
  if (!path.isAbsolute(destArchive)) {
    throw new Error("export destination must be an absolute path outside the store");
  }
  const storeRoot = path.resolve(store.root);
  if (destArchive === storeRoot || destArchive.startsWith(storeRoot + path.sep)) {
    throw new Error("export archive must not target the store root");
  }

  const files: Array<{ path: string; contentBase64: string }> = [];
  const walk = async (dir: string, prefix: string) => {
    let ents;
    try {
      ents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      const rel = path.posix.join(prefix, e.name);
      if (e.isDirectory()) await walk(abs, rel);
      else if (e.isFile()) {
        const buf = await readFile(abs);
        files.push({ path: rel, contentBase64: buf.toString("base64") });
      }
    }
  };
  await walk(path.join(store.root, "memory"), "memory");
  await walk(path.join(store.root, "revisions"), "revisions");
  for (const rel of ["MEMORY.md", "config.json"]) {
    const buf = await store.read(rel);
    if (buf) files.push({ path: rel, contentBase64: buf.toString("base64") });
  }

  await mkdir(path.dirname(destArchive), { recursive: true });
  const payload = files.map((f) => JSON.stringify(f)).join("\n") + "\n";
  await pipeline(Readable.from([payload]), createGzip(), createWriteStream(destArchive));
}

export async function importStore(
  store: MemoryStore,
  archivePath: string,
  mode: "merge" | "replace",
): Promise<{ imported: number; rejected: number; skipped: number }> {
  if (!path.isAbsolute(archivePath)) {
    throw new Error("import archive must be absolute");
  }
  if (mode !== "merge" && mode !== "replace") {
    throw new Error("import requires --merge or --replace");
  }
  const raw = gunzipSync(await readFile(archivePath)).toString("utf8");
  let imported = 0;
  let rejected = 0;
  let skipped = 0;

  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    const row = JSON.parse(line) as { path: string; contentBase64: string };
    try {
      assertSafeRelativePath(row.path);
    } catch {
      rejected += 1;
      continue;
    }
    const bodyBuf = Buffer.from(row.contentBase64, "base64");
    if (row.path === "MEMORY.md" || row.path.startsWith("memory/")) {
      try {
        const body = bodyBuf.toString("utf8");
        const base = await store.currentHash(row.path);
        await store.commitCanonical({
          relativePath: row.path,
          body,
          baseHash: base === BASE_ABSENT ? BASE_ABSENT : mode === "replace" ? base : base,
          provenance: { authored_by: "system", source: "import" },
        });
        imported += 1;
      } catch {
        rejected += 1;
      }
      continue;
    }
    if (row.path === "config.json" || row.path.startsWith("revisions/")) {
      try {
        await store.commitOperational({
          relativePath: row.path,
          body: bodyBuf,
          scanSecrets: false,
        });
        imported += 1;
      } catch {
        rejected += 1;
      }
      continue;
    }
    skipped += 1;
  }

  const index = await regenerateIndex(store);
  const indexHash = await store.currentHash("MEMORY.md");
  try {
    await store.commitCanonical({
      relativePath: "MEMORY.md",
      body: index,
      baseHash: indexHash,
      provenance: { authored_by: "system", source: "import-index" },
    });
  } catch {
    /* ok if unchanged / conflict */
  }
  return { imported, rejected, skipped };
}

```

### FILE src/doctor.ts
```
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { fileExists } from "./hash.js";
import { parseFrontmatter } from "./frontmatter.js";
import { scan } from "./secrets.js";
import type { MemoryStore } from "./store.js";
import { BYTE_CAP, LINE_CAP } from "./store.js";

export type DoctorReport = {
  root: string;
  memoryTreeHash: string;
  ok: boolean;
  checks: Array<{
    name: string;
    status: "pass" | "fail" | "EMPTY" | "COULD_NOT_MEASURE" | "PARTIAL";
    detail?: string;
  }>;
};

export async function runDoctor(store: MemoryStore): Promise<DoctorReport> {
  const checks: DoctorReport["checks"] = [];
  let ok = true;

  const cfg = await loadConfig(store.root);
  checks.push({
    name: "config",
    status: "pass",
    detail: `dream.enabled=${cfg.dream.enabled}`,
  });

  // scanner self-test
  const planted = scan("AKIAIOSFODNN7EXAMPLE");
  if (planted.length < 1) {
    ok = false;
    checks.push({
      name: "secret_scanner",
      status: "fail",
      detail: "planted AWS key not detected",
    });
  } else {
    checks.push({
      name: "secret_scanner",
      status: "pass",
      detail: `findings=${planted.length}`,
    });
  }

  const memDir = path.join(store.root, "memory");
  let memCount = 0;
  try {
    const walk = async (dir: string) => {
      const ents = await readdir(dir, { withFileTypes: true });
      for (const e of ents) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) await walk(abs);
        else if (e.name.endsWith(".md")) {
          memCount += 1;
          const raw = await readFile(abs, "utf8");
          parseFrontmatter(raw);
        }
      }
    };
    if (await fileExists(memDir)) await walk(memDir);
    checks.push({
      name: "memories",
      status: memCount === 0 ? "EMPTY" : "pass",
      detail:
        memCount === 0
          ? "memories: 0 — EMPTY, proves nothing"
          : `memories: ${memCount} checked`,
    });
  } catch (err) {
    ok = false;
    checks.push({
      name: "memories",
      status: "fail",
      detail: (err as Error).message,
    });
  }

  const index = await store.read("MEMORY.md");
  if (!index) {
    ok = false;
    checks.push({ name: "index", status: "fail", detail: "MEMORY.md missing" });
  } else {
    const text = index.toString("utf8");
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/\((memory\/[^)]+)\)/);
      if (!m) continue;
      const target = m[1]!;
      if (!(await store.read(target))) {
        ok = false;
        checks.push({
          name: "dangling_index",
          status: "fail",
          detail: target,
        });
      }
    }
    checks.push({
      name: "index_caps",
      status: "pass",
      detail: `lines=${lines.length}/${LINE_CAP} bytes=${index.length}/${BYTE_CAP}`,
    });
  }

  // corpus partial labels
  checks.push({
    name: "corpus_agy",
    status: "PARTIAL",
    detail: "PARTIAL — no dogfood receipts",
  });
  checks.push({
    name: "corpus_opencode",
    status: "PARTIAL",
    detail: "PARTIAL — no dogfood receipts",
  });

  const hash = await store.memoryTreeHash();
  return { root: store.root, memoryTreeHash: hash, ok, checks };
}

```

### FILE src/config.ts
```
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileExists } from "./hash.js";

export type StoreConfig = {
  dream: {
    enabled: boolean;
    policy: {
      focus?: string[];
      excludeSources?: string[];
      maxProposals?: number;
    };
  };
  memory: {
    policy: Record<string, unknown>;
  };
  secrets: {
    allowlist: string[];
  };
};

const FORBIDDEN_KEYS = new Set([
  "dream.schedule",
  "dream.auto",
  "schedule",
  "auto",
]);

export const DEFAULT_CONFIG: StoreConfig = {
  dream: { enabled: false, policy: {} },
  memory: { policy: {} },
  secrets: { allowlist: [] },
};

export function validateConfigObject(raw: unknown): StoreConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("config must be an object");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!["dream", "memory", "secrets"].includes(key)) {
      throw new Error(`Unknown config key: ${key}`);
    }
  }
  const dream = (obj.dream ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(dream)) {
    const dotted = `dream.${k}`;
    if (FORBIDDEN_KEYS.has(dotted) || FORBIDDEN_KEYS.has(k)) {
      throw new Error(`Forbidden config key: ${dotted}`);
    }
  }
  if ("schedule" in dream || "auto" in dream) {
    throw new Error("Forbidden config key: dream.schedule/auto");
  }
  const secrets = (obj.secrets ?? {}) as Record<string, unknown>;
  const allowlist = Array.isArray(secrets.allowlist)
    ? secrets.allowlist.map(String)
    : [];
  const memory = (obj.memory ?? { policy: {} }) as StoreConfig["memory"];
  const policy = (dream.policy ?? {}) as StoreConfig["dream"]["policy"];
  return {
    dream: {
      enabled: Boolean(dream.enabled ?? false),
      policy,
    },
    memory: {
      policy: (memory.policy ?? {}) as Record<string, unknown>,
    },
    secrets: { allowlist },
  };
}

export async function loadConfig(storeRoot: string): Promise<StoreConfig> {
  const p = path.join(storeRoot, "config.json");
  if (!(await fileExists(p))) return { ...DEFAULT_CONFIG };
  const raw = JSON.parse(await readFile(p, "utf8"));
  return validateConfigObject(raw);
}

/** Pure: default config bytes for the sole writer (`store.ts`) to persist. */
export function defaultConfigJson(): string {
  return JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";
}

```

### FILE src/corpus/cursor.ts
```
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CorpusSource, ScanOpts, ScanResult, Transcript } from "./types.js";

/**
 * Cursor corpus:
 * 1) Prefer fixture-pinned `*.vscdb` / `state.vscdb` via read-only `node:sqlite`
 * 2) Also accept Cursor JSONL under roots (migration / non-sqlite fixtures)
 */
export const cursorCorpus: CorpusSource = {
  name: "cursor",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const { readdir } = await import("node:fs/promises");
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      const files: string[] = [];
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else if (
              e.name.endsWith(".jsonl") ||
              e.name.endsWith(".vscdb") ||
              e.name === "state.vscdb"
            ) {
              files.push(abs);
            }
          }
        };
        await walk(root);
      } catch (err) {
        errors.push({ path: root, message: (err as Error).message });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (
          opts.scope === "project" &&
          opts.projectKey &&
          projectKey !== opts.projectKey
        ) {
          excluded += 1;
          continue;
        }
        try {
          if (file.endsWith(".vscdb")) {
            const turns = await readVscdbTurns(file);
            transcripts.push({
              id: path.basename(file, ".vscdb"),
              source: "cursor",
              path: file,
              scope: opts.scope,
              projectKey,
              turns,
            });
            continue;
          }
          const raw = await readFile(file, "utf8");
          const turns = [];
          for (const line of raw.split(/\r?\n/).filter(Boolean)) {
            const obj = JSON.parse(line) as {
              message?: { role?: string; content?: unknown };
              role?: string;
              text?: string;
            };
            if (obj.message) {
              const content = obj.message.content;
              turns.push({
                role: String(obj.message.role ?? "user"),
                text:
                  typeof content === "string"
                    ? content
                    : JSON.stringify(content ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            } else {
              turns.push({
                role: String(obj.role ?? "user"),
                text: String(obj.text ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            }
          }
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "cursor",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }
    return {
      transcripts,
      scanned,
      included: transcripts.length,
      excluded_permission: excluded,
      malformed,
      errors,
      label: scanned === 0 ? "EMPTY" : "OK",
    };
  },
};

/** Fixture schema: ItemTable key `composerData:<id>` → JSON { bubbles: [{type,text}] } */
async function readVscdbTurns(dbPath: string) {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rows = db
      .prepare(
        `SELECT key, value FROM ItemTable WHERE key LIKE 'composerData:%' OR key LIKE 'bubbleId:%'`,
      )
      .all() as Array<{ key: string; value: string | Buffer }>;
    const turns: Array<{
      role: string;
      text: string;
      tool_events: [];
      skill_invocations: [];
    }> = [];
    for (const row of rows) {
      const raw =
        typeof row.value === "string"
          ? row.value
          : Buffer.from(row.value).toString("utf8");
      try {
        const parsed = JSON.parse(raw) as {
          bubbles?: Array<{ type?: string; text?: string; role?: string }>;
          type?: string;
          text?: string;
          role?: string;
        };
        if (Array.isArray(parsed.bubbles)) {
          for (const b of parsed.bubbles) {
            turns.push({
              role: String(b.role ?? (b.type === "ai" ? "assistant" : "user")),
              text: String(b.text ?? ""),
              tool_events: [],
              skill_invocations: [],
            });
          }
        } else if (parsed.text) {
          turns.push({
            role: String(parsed.role ?? "user"),
            text: String(parsed.text),
            tool_events: [],
            skill_invocations: [],
          });
        }
      } catch {
        /* skip non-json cells */
      }
    }
    return turns;
  } finally {
    db.close();
  }
}

```

### FILE src/corpus/codex.ts
```
import type { CorpusSource, ScanOpts, ScanResult, Transcript } from "./types.js";

/** Codex session format (fixture-pinned): JSONL with {type,role,text,ts} */
export const codexCorpus: CorpusSource = {
  name: "codex",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const { readdir, readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      let files: string[] = [];
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else if (e.name.endsWith(".jsonl")) files.push(abs);
          }
        };
        await walk(root);
      } catch (err) {
        errors.push({ path: root, message: (err as Error).message });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (
          opts.scope === "project" &&
          opts.projectKey &&
          projectKey !== opts.projectKey
        ) {
          excluded += 1;
          continue;
        }
        try {
          const raw = await readFile(file, "utf8");
          const turns = [];
          for (const line of raw.split(/\r?\n/).filter(Boolean)) {
            const obj = JSON.parse(line) as Record<string, unknown>;
            // Codex fixture shape
            if (obj.role || obj.text) {
              turns.push({
                role: String(obj.role ?? "user"),
                text: String(obj.text ?? ""),
                ts: String(obj.ts ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
              continue;
            }
            // Also accept Claude-shaped for migration fixtures
            const message = obj.message as Record<string, unknown> | undefined;
            if (message) {
              turns.push({
                role: String(message.role ?? "user"),
                text:
                  typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content ?? ""),
                ts: String(obj.timestamp ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            }
          }
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "codex",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }
    return {
      transcripts,
      scanned,
      included: transcripts.length,
      excluded_permission: excluded,
      malformed,
      errors,
      label: scanned === 0 ? "EMPTY" : "OK",
    };
  },
};

```

### FILE src/mcp/handlers.ts
```
import { readdir } from "node:fs/promises";
import path from "node:path";
import { BASE_ABSENT, MemoryStore } from "../store.js";

export type McpResult =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: number; message: string } };

export async function handleToolCall(
  store: MemoryStore,
  name: string,
  args: Record<string, string>,
): Promise<McpResult> {
  if (name === "memory_read") {
    const buf = await store.read(args.path);
    return {
      ok: true,
      result: {
        content: [{ type: "text", text: buf ? buf.toString("utf8") : "" }],
      },
    };
  }
  if (name === "memory_search") {
    const out: string[] = [];
    const walk = async (dir: string, prefix: string) => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        const rel = path.posix.join(prefix, e.name);
        if (e.isDirectory()) await walk(abs, rel);
        else out.push(rel);
      }
    };
    try {
      await walk(path.join(store.root, "memory"), "memory");
    } catch {
      /* */
    }
    return {
      ok: true,
      result: { content: [{ type: "text", text: out.join("\n") }] },
    };
  }
  if (name === "memory_commit") {
    try {
      const r = await store.commitCanonical({
        relativePath: args.path,
        body: args.body,
        baseHash: args.baseHash || BASE_ABSENT,
        provenance: { authored_by: "agent", source: "mcp" },
      });
      return {
        ok: true,
        result: { content: [{ type: "text", text: JSON.stringify(r) }] },
      };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: -32000,
          message: (err as Error).name + ": " + (err as Error).message,
        },
      };
    }
  }
  if (name === "memory_propose") {
    try {
      const id = `mcp-${Date.now()}`;
      await store.commitOperational({
        relativePath: `proposals/${id}.json`,
        body:
          JSON.stringify(
            {
              id,
              action: "create",
              targetPath: args.path,
              base_hash: args.baseHash || BASE_ABSENT,
              body: args.body,
              evidence: [{ transcriptId: "mcp", quote: args.body?.slice(0, 80) }],
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          ) + "\n",
      });
      return {
        ok: true,
        result: { content: [{ type: "text", text: JSON.stringify({ id }) }] },
      };
    } catch (err) {
      return {
        ok: false,
        error: { code: -32000, message: (err as Error).message },
      };
    }
  }
  return {
    ok: false,
    error: { code: -32601, message: `unknown tool: ${name}` },
  };
}

```

### FILE src/dream/run.ts
```
import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config.js";
import type { Transcript } from "../corpus/types.js";
import { parseFrontmatter } from "../frontmatter.js";
import { scan, SecretDetected } from "../secrets.js";
import type { MemoryStore } from "../store.js";
import { applyDreamPolicy } from "./policy.js";

export type ProposalAction =
  | "create"
  | "update"
  | "supersede"
  | "expire"
  | "delete";

export type Proposal = {
  id: string;
  action: ProposalAction;
  targetPath: string;
  base_hash: string;
  body: string;
  evidence: Array<{ transcriptId: string; quote: string }>;
  createdAt: string;
  expiresAt?: string;
};

export function proposalId(
  p: Omit<Proposal, "id" | "createdAt" | "expiresAt">,
): string {
  const material = JSON.stringify({
    action: p.action,
    targetPath: p.targetPath,
    base_hash: p.base_hash,
    body: p.body,
    evidenceQuotes: p.evidence.map((e) => e.quote),
  });
  return createHash("sha256").update(material).digest("hex").slice(0, 16);
}

export function extractProposals(
  transcripts: Transcript[],
  storeHashes: Map<string, string>,
): Proposal[] {
  const out: Proposal[] = [];
  for (const t of transcripts) {
    for (const turn of t.turns) {
      if (turn.role !== "user" && turn.role !== "human") continue;
      const text = turn.text.trim();
      const pref = text.match(
        /(?:please remember|always|prefer|from now on)[:\s]+(.{10,200})/i,
      );
      if (!pref) continue;
      const body = `---\ntitle: Preference\ndescription: ${pref[1].slice(0, 80)}\n---\n\n${pref[1].trim()}\n`;
      const targetPath = `memory/pref-${createHash("sha256")
        .update(pref[1])
        .digest("hex")
        .slice(0, 8)}.md`;
      const draft = {
        action: "create" as const,
        targetPath,
        base_hash: storeHashes.get(targetPath) ?? "absent",
        body,
        evidence: [{ transcriptId: t.id, quote: pref[1].slice(0, 120) }],
      };
      out.push({
        ...draft,
        id: proposalId(draft),
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

async function loadStoreHashes(
  store: MemoryStore,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const memDir = path.join(store.root, "memory");
  const walk = async (dir: string, prefix: string) => {
    let ents;
    try {
      ents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      const rel = path.posix.join(prefix, e.name);
      if (e.isDirectory()) await walk(abs, rel);
      else if (e.name.endsWith(".md")) {
        map.set(rel, await store.currentHash(rel));
      }
    }
  };
  await walk(memDir, "memory");
  return map;
}

async function staleExpireProposals(
  store: MemoryStore,
  storeHashes: Map<string, string>,
  thresholdMs: number,
): Promise<Proposal[]> {
  const out: Proposal[] = [];
  const now = Date.now();
  for (const [rel, hash] of storeHashes) {
    const buf = await store.read(rel);
    if (!buf) continue;
    const { frontmatter } = parseFrontmatter(buf.toString("utf8"));
    const updated = frontmatter.updatedAt ?? frontmatter.createdAt;
    if (typeof updated !== "string") continue;
    const ts = Date.parse(updated);
    if (Number.isNaN(ts) || now - ts < thresholdMs) continue;
    const draft = {
      action: "expire" as const,
      targetPath: rel,
      base_hash: hash,
      body: buf.toString("utf8"),
      evidence: [
        {
          transcriptId: "staleness-pass",
          quote: `No incoming evidence; older than threshold (${updated})`,
        },
      ],
    };
    out.push({
      ...draft,
      id: proposalId(draft),
      createdAt: new Date().toISOString(),
    });
  }
  return out;
}

export async function runDream(
  store: MemoryStore,
  transcripts: Transcript[],
  counts: {
    scanned: number;
    included: number;
    excluded_permission: number;
  },
): Promise<{ proposals: Proposal[]; withheldSecrets: number; dropped: number }> {
  const before = await store.memoryTreeHash();
  const cfg = await loadConfig(store.root);
  const { kept: scoped, dropped: policyDropped } = applyDreamPolicy(
    transcripts,
    cfg.dream.policy,
  );

  if (scoped.length === 0) {
    const err = new Error(
      `EMPTY_CORPUS — proves nothing; scanned=${counts.scanned} included=${counts.included} excluded_permission=${counts.excluded_permission}`,
    );
    err.name = "EmptyCorpus";
    throw err;
  }

  const hashes = await loadStoreHashes(store);
  let proposals = [
    ...extractProposals(scoped, hashes),
    ...(await staleExpireProposals(store, hashes, 90 * 24 * 3600 * 1000)),
  ];
  if (cfg.dream.policy.maxProposals != null) {
    const max = cfg.dream.policy.maxProposals;
    if (proposals.length > max) {
      proposals = proposals.slice(0, max);
    }
  }

  let withheldSecrets = 0;
  const kept: Proposal[] = [];
  const allow = store.getSecretAllowlist();
  for (const p of proposals) {
    try {
      const blob = p.body + p.evidence.map((e) => e.quote).join("\n");
      const findings = scan(blob, allow);
      if (findings.length) {
        withheldSecrets += 1;
        continue;
      }
      await store.commitOperational({
        relativePath: `proposals/${p.id}.json`,
        body: JSON.stringify(p, null, 2) + "\n",
      });
      kept.push(p);
    } catch (err) {
      if (err instanceof SecretDetected) {
        withheldSecrets += 1;
        continue;
      }
      throw err;
    }
  }
  const after = await store.memoryTreeHash();
  if (after !== before) {
    throw new Error("Dream mutated canonical memoryTreeHash — abort");
  }
  return { proposals: kept, withheldSecrets, dropped: policyDropped };
}

```

### FILE src/dream/policy.ts
```
export type DreamPolicy = {
  focus?: string[];
  excludeSources?: string[];
  maxProposals?: number;
};

/** Filter transcripts by source exclusion. maxProposals is applied to proposals, not here. */
export function applyDreamPolicy<T extends { source: string }>(
  items: T[],
  policy: DreamPolicy,
): { kept: T[]; dropped: number } {
  let kept = items;
  if (policy.excludeSources?.length) {
    const ban = new Set(policy.excludeSources);
    kept = kept.filter((t) => !ban.has(t.source));
  }
  return { kept, dropped: items.length - kept.length };
}

export function memoryPolicyFragmentLines(
  memoryPolicy: Record<string, unknown>,
): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(memoryPolicy)) {
    lines.push(`- memory.policy.${k}: ${JSON.stringify(v)}`);
  }
  return lines;
}

```

### FILE package.json
```
{
  "name": "gotcontext-memory",
  "version": "0.9.0",
  "description": "Multi-harness disk-canonical markdown memory + HITL dreaming for Claude Code, agy, Codex, OpenCode, and Cursor",
  "type": "module",
  "engines": {
    "node": ">=22.5.0"
  },
  "bin": {
    "gotcontext-memory": "./dist/cli.js",
    "gcm": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "npm run build"
  },
  "files": [
    "dist",
    "README.md",
    "docs/HONESTY.md"
  ],
  "dependencies": {
    "commander": "13.1.0",
    "proper-lockfile": "4.1.2",
    "yaml": "2.7.0"
  },
  "devDependencies": {
    "@types/node": "22.13.10",
    "@types/proper-lockfile": "4.1.4",
    "typescript": "5.8.2",
    "tsx": "4.19.3",
    "vitest": "3.0.9"
  },
  "license": "MIT"
}

```

### FILE docs/HONESTY.md
```
# Honesty

## What this package claims

- **Dreaming** = scan permission-scoped transcripts → write **proposals only** →
  human `review accept|reject`. Canonical memory changes only on accept through
  `MemoryStore.commitCanonical` / `deleteCanonical` (CAS + secret scan + MEMORY.md caps).
- Parity target: omega / house **transcript_dream HITL** loop only.
- We do **not** claim parity with omega-orchestrator `memory_dream` auto-supersede.
- Fresh install never dreams unprompted (`dream.enabled` default false; no scheduler in v1).
- Version is **0.9.0** until CEO publish gate + CI matrix green on a clean checkout for `1.0.0`.

## Adapter / corpus matrix

| Harness | Install fragment | Corpus importer |
|---|---|---|
| Claude Code | CLAUDE.md managed block | Full — fixture-pinned Claude JSONL |
| Codex | AGENTS.md managed block | Full — fixture-pinned Codex JSONL (`role`/`text`/`ts`) |
| Cursor | `.cursor/rules/*.mdc` | Full — JSONL + read-only `node:sqlite` against `.vscdb` fixtures |
| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
| OpenCode | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |

## Caps & CAS

- MEMORY.md hard caps: ~200 lines / 25KB — reject, never auto-truncate.
- `memoryTreeHash` covers `memory/**` + `MEMORY.md` only (not proposals/revisions/receipts).
- Human edits outside the CLI are allowed; the **caller** must supply `baseHash` equal to
  current on-disk bytes (or `absent`). There is no silent reconciliation workflow in v1 —
  `doctor` reports drift; `commitCanonical` refuses stale CAS.

## Uninstall

- `gotcontext-memory uninstall` restores each touched adapter file from the
  installer manifest `preImageBase64` (byte-faithful) when a pre-image existed;
  files created solely by install strip the managed block.

## Scope / permission note

- Project filtering uses parent-directory basename (`projectKey`) against fixture roots
  and CLI-supplied roots. This is **fixture-level / partial path identity**, not a
  full harness workspace ACL. Do not read “permission-scoped” as OS permission enforcement.

```

### FILE README.md
```
# Gotcontext Memory

Multi-harness **disk-canonical markdown memory** + out-of-band **HITL dreaming**.

## Install

```bash
cd gotcontext-memory
npm install
npm run build
npm link   # exposes `gotcontext-memory` (and optional `gcm` alias)
```

Prefer the `gotcontext-memory` binary. The `gcm` alias can collide with **Git Credential Manager** on Windows.

```bash
gotcontext-memory init          # ~/.gotcontext
gotcontext-memory init --project
gotcontext-memory dream --source claude --store user
gotcontext-memory review list
gotcontext-memory review accept <id>
gotcontext-memory doctor
gotcontext-memory export /abs/path/out.gcm.gz
gotcontext-memory mcp
```

## Adapter matrix (honest)

| Harness | Fragment install | Corpus |
|---|---|---|
| Claude Code | yes | full |
| Codex | yes | full |
| Cursor | yes | full (JSONL + read-only sqlite fixtures) |
| agy | yes | PARTIAL |
| OpenCode | yes | PARTIAL |

## Honesty

See [docs/HONESTY.md](docs/HONESTY.md). Claims **transcript → proposal → human accept** only.
Does **not** claim omega `memory_dream` auto-supersede. Package version is **0.9.0** pending CEO `1.0.0` gate.

## Architecture

- Plan: `docs/superpowers/plans/2026-08-08-gotcontext-memory-multi-harness.md`
- Design: `docs/superpowers/specs/2026-08-08-gotcontext-memory-multi-harness-design.md`
- Sole store-root writes: `MemoryStore` (`commitCanonical` / `commitOperational` / `deleteCanonical`)
- Caps: MEMORY.md ~200 lines / 25KB; CAS via sha256 `baseHash`

```

### FILE .github/workflows/ci.yml
```
name: ci
on:
  push:
  pull_request:
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    10|        node: ["22"]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm pack
      - name: smoke install pack
        shell: bash
        run: |
          pkg=$(ls gotcontext-memory-*.tgz | head -1)
          mkdir -p /tmp/gcm-smoke && cd /tmp/gcm-smoke
          npm init -y >/dev/null
          npm install "$GITHUB_WORKSPACE/$pkg"
          npx gotcontext-memory --help
          SMOKE_HOME=$(mktemp -d)
          HOME="$SMOKE_HOME" npx gotcontext-memory init
          HOME="$SMOKE_HOME" npx gotcontext-memory doctor

```

### FILE test/guards.test.ts
```
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { exportStore } from "../src/portability.js";
import { MemoryStore } from "../src/store.js";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const FORBIDDEN = new Set([
  "writeFile",
  "writeFileSync",
  "rename",
  "renameSync",
  "unlink",
  "unlinkSync",
  "rm",
  "rmSync",
  "createWriteStream",
]);

/** Modules allowed to call fs mutation APIs (store-root or audited external). */
const ALLOWED = new Set(["store.ts", "installer.ts", "portability.ts"]);

function collectWriteCalls(filePath: string): string[] {
  const text = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.ES2022, true);
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      let name = "";
      if (ts.isPropertyAccessExpression(expr)) name = expr.name.text;
      else if (ts.isIdentifier(expr)) name = expr.text;
      if (FORBIDDEN.has(name)) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        hits.push(`${path.basename(filePath)}:${line + 1}:${name}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

describe("repo guards", () => {
  it("package.json has no omega/telegram/pipecat deps", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
    );
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ];
    for (const n of names) {
      expect(n).not.toMatch(/omega|telegram|pipecat/i);
    }
  });

  it("AST: only store/installer/portability may call fs mutation APIs", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(abs);
        else if (ent.name.endsWith(".ts")) {
          if (ALLOWED.has(path.basename(abs))) continue;
          offenders.push(...collectWriteCalls(abs));
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });

  it("positive control: fixture source with writeFile is flagged", () => {
    const fake = `
      import fs from "node:fs/promises";
      await fs.writeFile("x", "y");
    `;
    const sf = ts.createSourceFile("fake.ts", fake, ts.ScriptTarget.ES2022, true);
    let hit = false;
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "writeFile"
      ) {
        hit = true;
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    expect(hit).toBe(true);
  });

  it("portability refuses archive inside store root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-exp-"));
    const store = await MemoryStore.initStore(root);
    await expect(
      exportStore(store, path.join(root, "out.gcm.gz")),
    ).rejects.toThrow(/must not target the store root/);
  });

  it("installer refuses fragment path under store root", async () => {
    const { installFragments } = await import("../src/installer.js");
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-inst-"));
    await MemoryStore.initStore(root);
    await expect(
      installFragments({
        dryRun: true,
        home: root, // would make ~/.claude under store if adapters used home wrongly
        cwd: root,
        storeHint: root,
        storeRoot: root,
      }),
    ).rejects.toThrow(/refuses store-root target/);
  });
});

```


 succeeded in 1323ms:
# Current tree inventory (measured)
## src
src/adapters/types.ts
src/cli.ts
src/config.ts
src/corpus/agy.ts
src/corpus/claude.ts
src/corpus/codex.ts
src/corpus/cursor.ts
src/corpus/opencode.ts
src/corpus/types.ts
src/doctor.ts
src/dream/policy.ts
src/dream/run.ts
src/frontmatter.ts
src/hash.ts
src/index.ts
src/installer.ts
src/mcp/handlers.ts
src/mcp/server.ts
src/paths.ts
src/portability.ts
src/review.ts
src/secrets.ts
src/store.ts
## test
test/config.test.ts
test/corpus.test.ts
test/doctor.test.ts
test/dream.test.ts
test/guards.test.ts
test/installer.test.ts
test/mcp.test.ts
test/portability.test.ts
test/secrets.test.ts
test/store-extra.test.ts
test/store.test.ts
## package version
0.9.0
## npm test: 47 passed / 11 files (measured this session)


 succeeded in 1866ms:
# Honesty

## What this package claims

- **Dreaming** = scan permission-scoped transcripts → write **proposals only** →
  human `review accept|reject`. Canonical memory changes only on accept through
  `MemoryStore.commitCanonical` / `deleteCanonical` (CAS + secret scan + MEMORY.md caps).
- Parity target: omega / house **transcript_dream HITL** loop only.
- We do **not** claim parity with omega-orchestrator `memory_dream` auto-supersede.
- Fresh install never dreams unprompted (`dream.enabled` default false; no scheduler in v1).
- Version is **0.9.0** until CEO publish gate + CI matrix green on a clean checkout for `1.0.0`.

## Adapter / corpus matrix

| Harness | Install fragment | Corpus importer |
|---|---|---|
| Claude Code | CLAUDE.md managed block | Full — fixture-pinned Claude JSONL |
| Codex | AGENTS.md managed block | Full — fixture-pinned Codex JSONL (`role`/`text`/`ts`) |
| Cursor | `.cursor/rules/*.mdc` | Full — JSONL + read-only `node:sqlite` against `.vscdb` fixtures |
| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
| OpenCode | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |

## Caps & CAS

- MEMORY.md hard caps: ~200 lines / 25KB — reject, never auto-truncate.
- `memoryTreeHash` covers `memory/**` + `MEMORY.md` only (not proposals/revisions/receipts).
- Human edits outside the CLI are allowed; the **caller** must supply `baseHash` equal to
  current on-disk bytes (or `absent`). There is no silent reconciliation workflow in v1 —
  `doctor` reports drift; `commitCanonical` refuses stale CAS.

## Uninstall

- `gotcontext-memory uninstall` restores each touched adapter file from the
  installer manifest `preImageBase64` (byte-faithful) when a pre-image existed;
  files created solely by install strip the managed block.

## Scope / permission note

- Project filtering uses parent-directory basename (`projectKey`) against fixture roots
  and CLI-supplied roots. This is **fixture-level / partial path identity**, not a
  full harness workspace ACL. Do not read “permission-scoped” as OS permission enforcement.


exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"### Task\" \"docs\\superpowers\\plans\\2026-08-08-gotcontext-memory-multi-harness.md\"" in C:\dev\projects\gotcontext-memory
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /b /c:\"### FILE \" \"docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\BUNDLE.md\"" in C:\dev\projects\gotcontext-memory
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"Task \" \"docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\BUNDLE.md\"" in C:\dev\projects\gotcontext-memory
 succeeded in 903ms:
95:### Task 1 — Package scaffold + `MemoryStore` (canonical/operational/delete + locks + guards)
110:### Task 2 — Secret-scan commit gate (bidirectionally validated)
122:### Task 3 — MEMORY.md index generation + caps
134:### Task 4 — Store resolution + config (`user` vs `project` tiers)
146:### Task 5 — Corpus importers: Claude Code, Codex, Cursor (+ labeled agy/OpenCode stubs)
161:### Task 6 — `gcm dream`: proposals only (zero *canonical* writes), empty-corpus refusal
174:### Task 7 — `gcm review`: HITL accept/reject/expire with base_hash CAS
187:### Task 8 — Installer + five adapters (`gcm init` / `--dry-run` / `--uninstall`)
201:### Task 9 — `gcm doctor`
213:### Task 10 — `gcm export` / `gcm import` (portability)
225:### Task 11 — Optional shared MCP server (read + commit-mediated write)
238:### Task 12 — Dream-policy steering + docs honesty pass + release gate

 succeeded in 885ms:
1:### FILE src/review.ts
238:### FILE src/store.ts
626:### FILE src/installer.ts
793:### FILE src/portability.ts
921:### FILE src/doctor.ts
1049:### FILE src/config.ts
1137:### FILE src/corpus/cursor.ts
1314:### FILE src/corpus/codex.ts
1415:### FILE src/mcp/handlers.ts
1520:### FILE src/dream/run.ts
1728:### FILE src/dream/policy.ts
1761:### FILE package.json
1803:### FILE docs/HONESTY.md
1849:### FILE README.md
1901:### FILE .github/workflows/ci.yml
1937:### FILE test/guards.test.ts

2026-08-08T20:59:25.210163Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1.3 seconds
Output:

 exited 1 in 1256ms:
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"### Task\" \"docs\\superpowers\\plans\\2026-08-08-gotcontext-memory-multi-harness.md\"" in C:\dev\projects\gotcontext-memory
 succeeded in 470ms:
95:### Task 1 — Package scaffold + `MemoryStore` (canonical/operational/delete + locks + guards)
110:### Task 2 — Secret-scan commit gate (bidirectionally validated)
122:### Task 3 — MEMORY.md index generation + caps
134:### Task 4 — Store resolution + config (`user` vs `project` tiers)
146:### Task 5 — Corpus importers: Claude Code, Codex, Cursor (+ labeled agy/OpenCode stubs)
161:### Task 6 — `gcm dream`: proposals only (zero *canonical* writes), empty-corpus refusal
174:### Task 7 — `gcm review`: HITL accept/reject/expire with base_hash CAS
187:### Task 8 — Installer + five adapters (`gcm init` / `--dry-run` / `--uninstall`)
201:### Task 9 — `gcm doctor`
213:### Task 10 — `gcm export` / `gcm import` (portability)
225:### Task 11 — Optional shared MCP server (read + commit-mediated write)
238:### Task 12 — Dream-policy steering + docs honesty pass + release gate

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /b /c:\"### FILE \" \"docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\BUNDLE.md\"" in C:\dev\projects\gotcontext-memory
 succeeded in 459ms:
1:### FILE src/review.ts
238:### FILE src/store.ts
626:### FILE src/installer.ts
793:### FILE src/portability.ts
921:### FILE src/doctor.ts
1049:### FILE src/config.ts
1137:### FILE src/corpus/cursor.ts
1314:### FILE src/corpus/codex.ts
1415:### FILE src/mcp/handlers.ts
1520:### FILE src/dream/run.ts
1728:### FILE src/dream/policy.ts
1761:### FILE package.json
1803:### FILE docs/HONESTY.md
1849:### FILE README.md
1901:### FILE .github/workflows/ci.yml
1937:### FILE test/guards.test.ts

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"Task \" \"docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\BUNDLE.md\"" in C:\dev\projects\gotcontext-memory
2026-08-08T20:59:33.106250Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.4 seconds
Output:

 exited 1 in 437ms:
codex
The bundle is a focused 1,997-line snapshot covering the load-bearing areas. I’m now mapping each task’s acceptance gates to those bundled implementations and the measured test inventory.
2026-08-08T20:59:44.540984Z ERROR codex_core::tools::router: error=`"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command '$p = Get-Content -LiteralPath '"'docs\\superpowers\\plans\\2026-08-08-gotcontext-memory-multi-harness.md'; "'$p[94..258]'` rejected: blocked by policy
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command '$p = Get-Content -LiteralPath '"'docs\\superpowers\\plans\\2026-08-08-gotcontext-memory-multi-harness.md'; "'$p[94..258]' in C:\dev\projects\gotcontext-memory
 declined in 0ms:
`"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command '$p = Get-Content -LiteralPath '"'docs\\superpowers\\plans\\2026-08-08-gotcontext-memory-multi-harness.md'; "'$p[94..258]'` rejected: blocked by policy
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'docs\\superpowers\\plans\\2026-08-08-gotcontext-memory-multi-harness.md' -TotalCount 259" in C:\dev\projects\gotcontext-memory
 succeeded in 920ms:
# Gotcontext Memory Multi-Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `gotcontext-memory` — an installable Node/TypeScript package giving Claude Code, Antigravity (agy), Codex, OpenCode, and Cursor one disk-canonical markdown memory plane at `~/.gotcontext/` and/or `<project>/.gotcontext/`, with a single write API (`MemoryStore.commitCanonical()` — sha256 CAS, atomic rename, revision sidecars, secret scan, index caps) and an out-of-band **HITL transcript-dream loop** (corpus → `gcm dream` proposals → `gcm review` accept/reject). No omega dependencies.

**Architecture:** Locked **C — Hybrid** per `docs/thinktank_council_20260808_155453/CHAIRMAN_SYNTHESIS.md` (4/4 verdict seats). Disk-canonical markdown store; CLI-only dreaming in v1 (daemon is v1.1+ and may only *queue* proposals — never a second write path); adapters are managed instruction fragments for all five harnesses plus an optional shared MCP server; honesty boundary = parity with omega `transcript_dream` HITL only, never `memory_dream` auto-supersede (fable-audit CE honesty flags; `_dream_audit\fable-audit.md`).

**Tech Stack:** Node/TypeScript (one cross-platform CLI). Node ≥ 22.5, ESM, `commander`, `vitest`, `yaml`, pinned `proper-lockfile`. No native addons. Primary bin name **`gotcontext-memory`** (avoid `gcm` collision with Git Credential Manager on Windows; optional `gcm` alias documented as conflict-prone). Read-only `node:sqlite` allowed only for foreign corpus import (Cursor). Windows + macOS + Linux from Node only.

## Global Constraints

These are load-bearing; every task's tests must respect them. Sources: BRIEF constraints, CHAIRMAN_SYNTHESIS §Partial-Agreement resolutions, fable-audit CE-10..15 (guardrails: versioning+rollback+provenance, hash CAS, permission tiers, portability), `transcript-dream-hitl` SKILL.md (HITL contract), `_dream_audit\plan.md` / `research.md` (production failure modes: multi-writer, bad org-wide write, staleness, malicious injection), and `omega-jarvis\docs\superpowers\specs\2026-08-07-context-engineering-dreaming-design.md` (proposal/receipt shapes).

1. **Sole store-root mutation path = `store.ts`.** Every filesystem mutation under a `.gotcontext` store root (canonical memory, MEMORY.md, proposals, receipts, locks, revisions, config) goes through `MemoryStore` methods in `src/store.ts` only. Canonical path: `commitCanonical()` (CAS + secret scan + caps + revisions + commit journal). Operational path: `commitOperational()` (atomic write/move for proposals/receipts/config/locks; secret scan on proposal bodies; no MEMORY.md caps). Typed `deleteCanonical(path, baseHash)` captures prior bytes into revisions + journal, then removes/tombstones. The AST guard asserts **zero** `fs.writeFile`/`writeFileSync`/`rename`/`renameSync`/`unlink`/`rm`/`createWriteStream` call sites in any `src/**` module except `store.ts` (and `installer.ts` only for **non-store** adapter files).  Positive-control fixture is an in-memory source string, not a real violating file in `src/`. `installer.ts` must not write under a store root: store bootstrap uses `MemoryStore.initStore()`; uninstall manifest is either outside the store or written via `commitOperational`. `portability.ts` may write **only** to an explicit external archive path (never a store root) — AST allowlist + tests. `commitCanonical` used under an open `withCanonicalLocks(paths, fn)` session must use lock-aware internals (no nested lock acquire) to prevent deadlock. `regenerateIndex(store, { upserts, deletes })` is pure and models the post-accept state for preflight.
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
**Cursor corpus:** use read-only `node:sqlite` against fixture-pinned `state.vscdb` samples (no `better-sqlite3`).
**Do NOT:** Reach into harness config/credential files; claim agy/OpenCode corpus support anywhere user-facing; default-scope to “everything in the time window”; add native SQLite addons.

### Task 6 — `gcm dream`: proposals only (zero *canonical* writes), empty-corpus refusal

**Goal:** Corpus → extraction → operational proposals via `commitOperational` only. **Zero canonical-memory mutations** (`memoryTreeHash` identical). Operational proposal writes are expected and allowed.
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
- [ ] 2. Implement `withCanonicalLocks` session: preflight via `regenerateIndex(store, { upserts, deletes })` → `commitCanonicalLocked` × N → operational receipt; plain-text listing.
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
- [ ] 4. Runtime arm: `init` against sandbox with pre-existing store leaves that store's tree byte-identical (store bootstrap only via `MemoryStore.initStore()`; manifest via `commitOperational` or path outside store).
**Do NOT:** Auto-register MCP without `--mcp`; write store roots from installer-local `fs`; use shell scripts; primary-advertise the `gcm` bin on Windows without the Git Credential Manager collision warning.

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
**Do NOT:** Export harness credentials or transcripts; invent a custom binary format; unpack/write archives into a store root (archive writer is external-path-only; tested).

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
- **No SQLite as a gotcontext store or writable cache in v1.** Read-only use of Node built-in `node:sqlite` (no native addons) is permitted solely to import foreign harness corpora (e.g. Cursor `state.vscdb`). Never a second writable truth.
- **No org/team memory tier**, no Managed-Agents-API clone, no cloud sync.
- **No LLM-in-the-loop extraction requirement** — the deterministic pipeline stands alone; model-assisted candidate generation is a flagged v1.1 experiment.

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\BUNDLE.md' -TotalCount 626" in C:\dev\projects\gotcontext-memory
 succeeded in 1068ms:
### FILE src/review.ts
```
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { regenerateIndex } from "./index.js";
import type { Proposal } from "./dream/run.js";
import { scan, SecretDetected } from "./secrets.js";
import {
  BASE_ABSENT,
  checkIndexCaps,
  MemoryStore,
} from "./store.js";

export async function listProposals(store: MemoryStore): Promise<Proposal[]> {
  const dir = path.join(store.root, "proposals");
  const ents = await readdir(dir);
  const out: Proposal[] = [];
  for (const name of ents) {
    if (!name.endsWith(".json")) continue;
    const raw = await readFile(path.join(dir, name), "utf8");
    out.push(JSON.parse(raw) as Proposal);
  }
  return out;
}

export async function rejectProposal(
  store: MemoryStore,
  id: string,
  reason: string,
): Promise<void> {
  const before = await store.memoryTreeHash();
  const raw = await readFile(
    path.join(store.root, "proposals", `${id}.json`),
    "utf8",
  );
  await store.commitOperational({
    relativePath: `proposals/rejected/${id}.json`,
    body: JSON.stringify({ ...JSON.parse(raw), reason }, null, 2) + "\n",
    scanSecrets: false,
  });
  await store.removeOperational(`proposals/${id}.json`);
  const after = await store.memoryTreeHash();
  if (after !== before) throw new Error("reject mutated memoryTreeHash");
}

export async function acceptProposal(
  store: MemoryStore,
  id: string,
  opts: { yesDelete?: boolean } = {},
): Promise<void> {
  const rel = `proposals/${id}.json`;
  const raw = await readFile(path.join(store.root, rel), "utf8");
  const proposal = JSON.parse(raw) as Proposal;

  if (!proposal.targetPath || !proposal.action || !proposal.base_hash) {
    throw new Error("invalid proposal schema");
  }
  if (proposal.expiresAt && Date.parse(proposal.expiresAt) < Date.now()) {
    throw new Error(`proposal expired: ${id}`);
  }
  if (proposal.action === "delete" && !opts.yesDelete) {
    throw new Error("delete requires --yes-delete on a named id");
  }

  const overlayUpserts: Record<string, string> = {};
  const overlayDeletes: string[] = [];
  let expireBody: string | null = null;

  if (
    proposal.action === "create" ||
    proposal.action === "update" ||
    proposal.action === "supersede"
  ) {
    overlayUpserts[proposal.targetPath] = proposal.body;
  } else if (proposal.action === "expire") {
    const existing = await store.read(proposal.targetPath);
    if (!existing) throw new Error(`expire target missing: ${proposal.targetPath}`);
    const { frontmatter, body } = parseFrontmatter(existing.toString("utf8"));
    frontmatter.expires = new Date().toISOString();
    expireBody = serializeFrontmatter(frontmatter, body);
    overlayUpserts[proposal.targetPath] = expireBody;
  } else if (proposal.action === "delete") {
    overlayDeletes.push(proposal.targetPath);
  }

  const indexBytes = await regenerateIndex(store, {
    upserts: overlayUpserts,
    deletes: overlayDeletes,
  });

  // Preflight: secrets + caps before any canonical mutation
  const targetBody =
    expireBody ??
    overlayUpserts[proposal.targetPath] ??
    proposal.body;
  if (proposal.action !== "delete") {
    const findings = scan(targetBody, store.getSecretAllowlist());
    if (findings.length) throw new SecretDetected(findings);
  }
  try {
    checkIndexCaps(indexBytes);
  } catch (err) {
    throw err;
  }
  const indexFindings = scan(indexBytes, store.getSecretAllowlist());
  if (indexFindings.length) throw new SecretDetected(indexFindings);

  try {
    await store.withCanonicalLocks(
      [proposal.targetPath, "MEMORY.md"],
      async (locked) => {
        const targetBefore = await store.read(proposal.targetPath);
        const targetBeforeHash = targetBefore
          ? (await import("./hash.js")).sha256Hex(targetBefore)
          : BASE_ABSENT;

        if (proposal.action === "delete") {
          const base =
            proposal.base_hash === "absent"
              ? BASE_ABSENT
              : proposal.base_hash;
          await locked.deleteCanonicalLocked({
            relativePath: proposal.targetPath,
            baseHash: base,
            provenance: { authored_by: "dream", proposal_id: id },
          });
        } else if (proposal.action === "expire") {
          await locked.commitCanonicalLocked({
            relativePath: proposal.targetPath,
            body: expireBody!,
            baseHash: proposal.base_hash,
            provenance: {
              authored_by: "dream",
              proposal_id: id,
              source: "expire",
            },
          });
        } else {
          await locked.commitCanonicalLocked({
            relativePath: proposal.targetPath,
            body: proposal.body,
            baseHash: proposal.base_hash,
            provenance: { authored_by: "dream", proposal_id: id },
          });
        }
        try {
          const indexHash = await store.currentHash("MEMORY.md");
          await locked.commitCanonicalLocked({
            relativePath: "MEMORY.md",
            body: indexBytes,
            baseHash: indexHash,
            provenance: { authored_by: "system", proposal_id: id },
          });
        } catch (indexErr) {
          // Roll back target so accept never leaves half-applied canonical state.
          const { sha256Hex } = await import("./hash.js");
          if (proposal.action === "delete") {
            if (targetBefore) {
              await locked.commitCanonicalLocked({
                relativePath: proposal.targetPath,
                body: targetBefore.toString("utf8"),
                baseHash: BASE_ABSENT,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            }
          } else {
            const cur = await store.currentHash(proposal.targetPath);
            if (targetBefore) {
              await locked.commitCanonicalLocked({
                relativePath: proposal.targetPath,
                body: targetBefore.toString("utf8"),
                baseHash: cur,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            } else {
              await locked.deleteCanonicalLocked({
                relativePath: proposal.targetPath,
                baseHash: cur,
                provenance: {
                  authored_by: "system",
                  proposal_id: id,
                  source: "accept-rollback",
                },
              });
            }
          }
          void targetBeforeHash;
          void sha256Hex;
          throw indexErr;
        }
      },
    );
  } catch (err) {
    await store.commitOperational({
      relativePath: `receipts/${id}.error.json`,
      body:
        JSON.stringify({
          id,
          status: "error",
          code: "INDEX_DRIFT_OR_CAS",
          message: (err as Error).message,
          at: new Date().toISOString(),
        }) + "\n",
      scanSecrets: false,
    });
    throw err;
  }

  await store.commitOperational({
    relativePath: `proposals/accepted/${id}.json`,
    body: raw,
    scanSecrets: false,
  });
  await store.removeOperational(`proposals/${id}.json`);
  await store.commitOperational({
    relativePath: `receipts/${id}.json`,
    body:
      JSON.stringify({
        id,
        status: "accepted",
        at: new Date().toISOString(),
      }) + "\n",
    scanSecrets: false,
  });
}

```

### FILE src/store.ts
```
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import { defaultConfigJson, loadConfig } from "./config.js";
import { fileExists, memoryTreeHash, sha256Hex } from "./hash.js";
import {
  assertSafeRelativePath,
  resolveUnderStore,
  resolveUnderStoreSync,
} from "./paths.js";
import { scan, SecretDetected } from "./secrets.js";

export class CasConflict extends Error {
  currentHash: string;
  constructor(currentHash: string) {
    super(`CasConflict: expected baseHash mismatch; current=${currentHash}`);
    this.name = "CasConflict";
    this.currentHash = currentHash;
  }
}

export class IndexCapExceeded extends Error {
  constructor(
    public lines: number,
    public bytes: number,
    public lineCap: number,
    public byteCap: number,
  ) {
    super(
      `IndexCapExceeded: lines=${lines}/${lineCap} bytes=${bytes}/${byteCap}`,
    );
    this.name = "IndexCapExceeded";
  }
}

export type CommitProvenance = {
  authored_by: "dream" | "agent" | "human" | "system";
  source?: string;
  transcript_id?: string | null;
  proposal_id?: string;
};

export const LINE_CAP = 200;
export const BYTE_CAP = 25 * 1024;
export const BASE_ABSENT = "absent";

function assertCanonicalRel(rel: string): void {
  if (!(rel === "MEMORY.md" || rel.startsWith("memory/"))) {
    throw new Error(`Canonical path required, got ${rel}`);
  }
}

export function checkIndexCaps(body: string): void {
  const lines = body.split(/\r?\n/).length;
  const bytes = Buffer.byteLength(body, "utf8");
  if (lines > LINE_CAP || bytes > BYTE_CAP) {
    throw new IndexCapExceeded(lines, bytes, LINE_CAP, BYTE_CAP);
  }
}

export class MemoryStore {
  private allowlist: string[] = [];

  constructor(public readonly root: string) {}

  static async initStore(root: string): Promise<MemoryStore> {
    await mkdir(path.join(root, "memory"), { recursive: true });
    await mkdir(path.join(root, "proposals"), { recursive: true });
    await mkdir(path.join(root, "proposals", "accepted"), { recursive: true });
    await mkdir(path.join(root, "proposals", "rejected"), { recursive: true });
    await mkdir(path.join(root, "revisions"), { recursive: true });
    await mkdir(path.join(root, "receipts"), { recursive: true });
    await mkdir(path.join(root, "locks"), { recursive: true });
    const index = path.join(root, "MEMORY.md");
    if (!(await fileExists(index))) {
      await writeFile(index, "# Memory index\n\n", "utf8");
    }
    const cfgPath = path.join(root, "config.json");
    if (!(await fileExists(cfgPath))) {
      await writeFile(cfgPath, defaultConfigJson(), "utf8");
    }
    const store = new MemoryStore(root);
    await store.reloadConfig();
    return store;
  }

  async reloadConfig(): Promise<void> {
    const cfg = await loadConfig(this.root);
    this.allowlist = cfg.secrets.allowlist;
  }

  getSecretAllowlist(): string[] {
    return [...this.allowlist];
  }

  async memoryTreeHash(): Promise<string> {
    return memoryTreeHash(this.root);
  }

  async withCanonicalLocks<T>(
    relPaths: string[],
    fn: (locked: LockedStore) => Promise<T>,
  ): Promise<T> {
    const sorted = [...new Set(relPaths.map((p) => p.replace(/\\/g, "/")))].sort();
    const releases: Array<() => Promise<void>> = [];
    try {
      for (const rel of sorted) {
        // Containment before canonical predicate so traversal never reaches locks.
        assertSafeRelativePath(rel);
        if (!(rel === "MEMORY.md" || rel.startsWith("memory/"))) {
          throw new Error(`withCanonicalLocks only for canonical paths: ${rel}`);
        }
        const abs = await resolveUnderStore(this.root, rel);
        await mkdir(path.dirname(abs), { recursive: true });
        if (!(await fileExists(abs))) {
          const stub = path.join(
            this.root,
            "locks",
            `${sha256Hex(rel)}.lock`,
          );
          await writeFile(stub, "", { flag: "a" });
          const release = await lockfile.lock(stub, {
            retries: { retries: 10, minTimeout: 20, maxTimeout: 200 },
            stale: 10_000,
          });
          releases.push(release);
        } else {
          const release = await lockfile.lock(abs, {
            retries: { retries: 10, minTimeout: 20, maxTimeout: 200 },
            stale: 10_000,
          });
          releases.push(release);
        }
      }
      return await fn(new LockedStore(this));
    } finally {
      for (const release of releases.reverse()) {
        try {
          await release();
        } catch {
          /* ignore */
        }
      }
    }
  }

  async commitCanonical(opts: {
    relativePath: string;
    body: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<{ hash: string }> {
    return this.withCanonicalLocks([opts.relativePath], (locked) =>
      locked.commitCanonicalLocked(opts),
    );
  }

  async commitOperational(opts: {
    relativePath: string;
    body: string | Buffer;
    scanSecrets?: boolean;
  }): Promise<void> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    if (rel === "MEMORY.md" || rel.startsWith("memory/")) {
      throw new Error("Use commitCanonical for canonical memory paths");
    }
    const text =
      typeof opts.body === "string" ? opts.body : opts.body.toString("utf8");
    if (opts.scanSecrets !== false) {
      const findings = scan(text, this.allowlist);
      if (findings.length) throw new SecretDetected(findings);
    }
    const abs = await resolveUnderStore(this.root, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
    const fh = await open(tmp, "w");
    try {
      await fh.writeFile(opts.body);
      await fh.close();
      await rename(tmp, abs);
    } catch (err) {
      try {
        await fh.close();
      } catch {
        /* */
      }
      await rm(tmp, { force: true });
      throw err;
    }
  }

  async deleteCanonical(opts: {
    relativePath: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<void> {
    await this.withCanonicalLocks([opts.relativePath], async (locked) => {
      await locked.deleteCanonicalLocked(opts);
    });
  }

  async removeOperational(relativePath: string): Promise<void> {
    const rel = relativePath.replace(/\\/g, "/");
    if (rel === "MEMORY.md" || rel.startsWith("memory/")) {
      throw new Error("Use deleteCanonical for canonical paths");
    }
    const abs = await resolveUnderStore(this.root, rel);
    await rm(abs, { force: true });
  }

  async read(relativePath: string): Promise<Buffer | null> {
    const abs = await resolveUnderStore(this.root, relativePath);
    try {
      return await readFile(abs);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async currentHash(relativePath: string): Promise<string> {
    const buf = await this.read(relativePath);
    return buf ? sha256Hex(buf) : BASE_ABSENT;
  }

  async history(relativePath: string): Promise<
    Array<{ hash: string; path: string; meta?: Record<string, unknown> }>
  > {
    const revDir = path.join(this.root, "revisions");
    const prefix = relativePath.replace(/\//g, "__") + ".";
    const { readdir } = await import("node:fs/promises");
    let names: string[] = [];
    try {
      names = await readdir(revDir);
    } catch {
      return [];
    }
    const out = [];
    for (const name of names) {
      if (!name.startsWith(prefix) || !name.endsWith(".md")) continue;
      const hashPart = name.slice(prefix.length, -3);
      const metaPath = path.join(revDir, name.replace(/\.md$/, ".meta.json"));
      let meta: Record<string, unknown> | undefined;
      try {
        meta = JSON.parse(await readFile(metaPath, "utf8"));
      } catch {
        /* */
      }
      out.push({
        hash: hashPart,
        path: path.join(revDir, name),
        meta,
      });
    }
    return out;
  }

  async rollback(
    relativePath: string,
    revisionHashPrefix: string,
    provenance: CommitProvenance,
  ): Promise<void> {
    const hist = await this.history(relativePath);
    const hit = hist.find((h) => h.hash.startsWith(revisionHashPrefix));
    if (!hit) throw new Error(`revision not found: ${revisionHashPrefix}`);
    const body = await readFile(hit.path, "utf8");
    const base = await this.currentHash(relativePath);
    await this.commitCanonical({
      relativePath,
      body,
      baseHash: base,
      provenance: { ...provenance, source: `rollback:${revisionHashPrefix}` },
    });
  }
}

export class LockedStore {
  constructor(private readonly store: MemoryStore) {}

  async commitCanonicalLocked(opts: {
    relativePath: string;
    body: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<{ hash: string }> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    assertCanonicalRel(rel);
    const findings = scan(opts.body, this.store.getSecretAllowlist());
    if (findings.length) throw new SecretDetected(findings);
    if (rel === "MEMORY.md") checkIndexCaps(opts.body);

    const abs = await resolveUnderStore(this.store.root, rel);
    const existing = await this.store.read(rel);
    const currentHash = existing ? sha256Hex(existing) : BASE_ABSENT;
    if (currentHash !== opts.baseHash) {
      throw new CasConflict(currentHash);
    }

    if (existing) {
      const revDir = path.join(this.store.root, "revisions");
      await mkdir(revDir, { recursive: true });
      const stem = `${rel.replace(/\//g, "__")}.${currentHash.slice(0, 12)}`;
      await writeFile(path.join(revDir, `${stem}.md`), existing);
      await writeFile(
        path.join(revDir, `${stem}.meta.json`),
        JSON.stringify(
          {
            path: rel,
            hash: currentHash,
            at: new Date().toISOString(),
            provenance: opts.provenance,
            allowlist: this.store.getSecretAllowlist(),
          },
          null,
          2,
        ) + "\n",
      );
    }

    await mkdir(path.dirname(abs), { recursive: true });
    const tmp = `${abs}.${process.pid}.${Date.now()}.tmp`;
    const fh = await open(tmp, "w");
    try {
      await fh.writeFile(opts.body, "utf8");
      await fh.close();
      await rename(tmp, abs);
    } catch (err) {
      try {
        await fh.close();
      } catch {
        /* */
      }
      await rm(tmp, { force: true });
      throw err;
    }

    const hash = sha256Hex(opts.body);
    await appendJournal(this.store.root, {
      op: "commitCanonical",
      path: rel,
      baseHash: opts.baseHash,
      hash,
      at: new Date().toISOString(),
      provenance: opts.provenance,
      allowlist: this.store.getSecretAllowlist(),
    });
    return { hash };
  }

  async deleteCanonicalLocked(opts: {
    relativePath: string;
    baseHash: string;
    provenance: CommitProvenance;
  }): Promise<void> {
    const rel = opts.relativePath.replace(/\\/g, "/");
    assertCanonicalRel(rel);
    const existing = await this.store.read(rel);
    const currentHash = existing ? sha256Hex(existing) : BASE_ABSENT;
    if (currentHash !== opts.baseHash) throw new CasConflict(currentHash);
    if (!existing) return;
    const revDir = path.join(this.store.root, "revisions");
    await mkdir(revDir, { recursive: true });
    const stem = `${rel.replace(/\//g, "__")}.${currentHash.slice(0, 12)}`;
    await writeFile(path.join(revDir, `${stem}.md`), existing);
    await writeFile(
      path.join(revDir, `${stem}.meta.json`),
      JSON.stringify(
        {
          path: rel,
          hash: currentHash,
          at: new Date().toISOString(),
          provenance: opts.provenance,
          deleted: true,
        },
        null,
        2,
      ) + "\n",
    );
    const abs = await resolveUnderStore(this.store.root, rel);
    await rm(abs, { force: true });
    await appendJournal(this.store.root, {
 
…TRUNCATED…

```

### FILE src/installer.ts

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'docs\\superpowers\\audits\\codex_impl_audit_20260808_165851\\BUNDLE.md' -Tail 1372" in C:\dev\projects\gotcontext-memory
 succeeded in 1181ms:
        manifest.push({
          adapter: a.id,
          path: target,
          preImageHash: null,
          preImageBase64: null,
          blockHash,
        });
        continue;
      }
      throw new Error(`Conflicting managed fragments for ${target}`);
    }

    let existing = "";
    if (await fileExists(target)) existing = await readFile(target, "utf8");
    const preImageHash = existing ? sha256Hex(existing) : null;
    const preImageBase64 = existing
      ? Buffer.from(existing, "utf8").toString("base64")
      : null;

    if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
      const start = existing.indexOf(MARK_BEGIN);
      const end = existing.indexOf(MARK_END) + MARK_END.length;
      const managed = existing.slice(start, end);
      if (norm(managed) !== norm(fragment) && !opts.force) {
        throw new Error(
          `Managed block tampered in ${target}; pass --force to overwrite`,
        );
      }
    }

    manifest.push({
      adapter: a.id,
      path: target,
      preImageHash,
      preImageBase64,
      blockHash,
    });
    writtenThisRun.set(absTarget, blockHash);
    if (opts.dryRun) continue;
    await mkdir(path.dirname(target), { recursive: true });
    const next = upsertManaged(existing, fragment);
    await writeFile(target, next, "utf8");
  }

  return { planned, manifest };
}

export async function uninstallFragments(opts: {
  storeRoot: string;
  force?: boolean;
}): Promise<string[]> {
  const manPath = path.join(opts.storeRoot, "installer-manifest.json");
  if (!(await fileExists(manPath))) {
    throw new Error("No installer-manifest.json — nothing to uninstall");
  }
  const man = JSON.parse(await readFile(manPath, "utf8")) as {
    entries: ManifestEntry[];
  };
  const restored: string[] = [];
  for (const e of man.entries) {
    if (e.preImageBase64 != null) {
      await writeFile(
        e.path,
        Buffer.from(e.preImageBase64, "base64").toString("utf8"),
        "utf8",
      );
    } else if (await fileExists(e.path)) {
      // File was created by us — remove managed block; if empty leftover, leave empty file
      const existing = await readFile(e.path, "utf8");
      if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
        const start = existing.indexOf(MARK_BEGIN);
        const end = existing.indexOf(MARK_END) + MARK_END.length;
        const without =
          (existing.slice(0, start) + existing.slice(end)).trimEnd() + "\n";
        await writeFile(e.path, without === "\n" ? "" : without, "utf8");
      }
    }
    restored.push(e.path);
  }
  await writeFile(
    manPath,
    JSON.stringify({
      entries: [],
      uninstalledAt: new Date().toISOString(),
    }) + "\n",
  );
  return restored;
}

function upsertManaged(existing: string, fragment: string): string {
  if (existing.includes(MARK_BEGIN) && existing.includes(MARK_END)) {
    const start = existing.indexOf(MARK_BEGIN);
    const end = existing.indexOf(MARK_END) + MARK_END.length;
    return existing.slice(0, start) + fragment + existing.slice(end);
  }
  if (!existing.trim()) return fragment + "\n";
  return existing.replace(/\s*$/, "\n\n") + fragment + "\n";
}

```

### FILE src/portability.ts
```
import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip, gunzipSync } from "node:zlib";
import { regenerateIndex } from "./index.js";
import { assertSafeRelativePath } from "./paths.js";
import { BASE_ABSENT, MemoryStore } from "./store.js";

export async function exportStore(
  store: MemoryStore,
  destArchive: string,
): Promise<void> {
  if (!path.isAbsolute(destArchive)) {
    throw new Error("export destination must be an absolute path outside the store");
  }
  const storeRoot = path.resolve(store.root);
  if (destArchive === storeRoot || destArchive.startsWith(storeRoot + path.sep)) {
    throw new Error("export archive must not target the store root");
  }

  const files: Array<{ path: string; contentBase64: string }> = [];
  const walk = async (dir: string, prefix: string) => {
    let ents;
    try {
      ents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      const rel = path.posix.join(prefix, e.name);
      if (e.isDirectory()) await walk(abs, rel);
      else if (e.isFile()) {
        const buf = await readFile(abs);
        files.push({ path: rel, contentBase64: buf.toString("base64") });
      }
    }
  };
  await walk(path.join(store.root, "memory"), "memory");
  await walk(path.join(store.root, "revisions"), "revisions");
  for (const rel of ["MEMORY.md", "config.json"]) {
    const buf = await store.read(rel);
    if (buf) files.push({ path: rel, contentBase64: buf.toString("base64") });
  }

  await mkdir(path.dirname(destArchive), { recursive: true });
  const payload = files.map((f) => JSON.stringify(f)).join("\n") + "\n";
  await pipeline(Readable.from([payload]), createGzip(), createWriteStream(destArchive));
}

export async function importStore(
  store: MemoryStore,
  archivePath: string,
  mode: "merge" | "replace",
): Promise<{ imported: number; rejected: number; skipped: number }> {
  if (!path.isAbsolute(archivePath)) {
    throw new Error("import archive must be absolute");
  }
  if (mode !== "merge" && mode !== "replace") {
    throw new Error("import requires --merge or --replace");
  }
  const raw = gunzipSync(await readFile(archivePath)).toString("utf8");
  let imported = 0;
  let rejected = 0;
  let skipped = 0;

  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    const row = JSON.parse(line) as { path: string; contentBase64: string };
    try {
      assertSafeRelativePath(row.path);
    } catch {
      rejected += 1;
      continue;
    }
    const bodyBuf = Buffer.from(row.contentBase64, "base64");
    if (row.path === "MEMORY.md" || row.path.startsWith("memory/")) {
      try {
        const body = bodyBuf.toString("utf8");
        const base = await store.currentHash(row.path);
        await store.commitCanonical({
          relativePath: row.path,
          body,
          baseHash: base === BASE_ABSENT ? BASE_ABSENT : mode === "replace" ? base : base,
          provenance: { authored_by: "system", source: "import" },
        });
        imported += 1;
      } catch {
        rejected += 1;
      }
      continue;
    }
    if (row.path === "config.json" || row.path.startsWith("revisions/")) {
      try {
        await store.commitOperational({
          relativePath: row.path,
          body: bodyBuf,
          scanSecrets: false,
        });
        imported += 1;
      } catch {
        rejected += 1;
      }
      continue;
    }
    skipped += 1;
  }

  const index = await regenerateIndex(store);
  const indexHash = await store.currentHash("MEMORY.md");
  try {
    await store.commitCanonical({
      relativePath: "MEMORY.md",
      body: index,
      baseHash: indexHash,
      provenance: { authored_by: "system", source: "import-index" },
    });
  } catch {
    /* ok if unchanged / conflict */
  }
  return { imported, rejected, skipped };
}

```

### FILE src/doctor.ts
```
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { fileExists } from "./hash.js";
import { parseFrontmatter } from "./frontmatter.js";
import { scan } from "./secrets.js";
import type { MemoryStore } from "./store.js";
import { BYTE_CAP, LINE_CAP } from "./store.js";

export type DoctorReport = {
  root: string;
  memoryTreeHash: string;
  ok: boolean;
  checks: Array<{
    name: string;
    status: "pass" | "fail" | "EMPTY" | "COULD_NOT_MEASURE" | "PARTIAL";
    detail?: string;
  }>;
};

export async function runDoctor(store: MemoryStore): Promise<DoctorReport> {
  const checks: DoctorReport["checks"] = [];
  let ok = true;

  const cfg = await loadConfig(store.root);
  checks.push({
    name: "config",
    status: "pass",
    detail: `dream.enabled=${cfg.dream.enabled}`,
  });

  // scanner self-test
  const planted = scan("AKIAIOSFODNN7EXAMPLE");
  if (planted.length < 1) {
    ok = false;
    checks.push({
      name: "secret_scanner",
      status: "fail",
      detail: "planted AWS key not detected",
    });
  } else {
    checks.push({
      name: "secret_scanner",
      status: "pass",
      detail: `findings=${planted.length}`,
    });
  }

  const memDir = path.join(store.root, "memory");
  let memCount = 0;
  try {
    const walk = async (dir: string) => {
      const ents = await readdir(dir, { withFileTypes: true });
      for (const e of ents) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) await walk(abs);
        else if (e.name.endsWith(".md")) {
          memCount += 1;
          const raw = await readFile(abs, "utf8");
          parseFrontmatter(raw);
        }
      }
    };
    if (await fileExists(memDir)) await walk(memDir);
    checks.push({
      name: "memories",
      status: memCount === 0 ? "EMPTY" : "pass",
      detail:
        memCount === 0
          ? "memories: 0 — EMPTY, proves nothing"
          : `memories: ${memCount} checked`,
    });
  } catch (err) {
    ok = false;
    checks.push({
      name: "memories",
      status: "fail",
      detail: (err as Error).message,
    });
  }

  const index = await store.read("MEMORY.md");
  if (!index) {
    ok = false;
    checks.push({ name: "index", status: "fail", detail: "MEMORY.md missing" });
  } else {
    const text = index.toString("utf8");
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/\((memory\/[^)]+)\)/);
      if (!m) continue;
      const target = m[1]!;
      if (!(await store.read(target))) {
        ok = false;
        checks.push({
          name: "dangling_index",
          status: "fail",
          detail: target,
        });
      }
    }
    checks.push({
      name: "index_caps",
      status: "pass",
      detail: `lines=${lines.length}/${LINE_CAP} bytes=${index.length}/${BYTE_CAP}`,
    });
  }

  // corpus partial labels
  checks.push({
    name: "corpus_agy",
    status: "PARTIAL",
    detail: "PARTIAL — no dogfood receipts",
  });
  checks.push({
    name: "corpus_opencode",
    status: "PARTIAL",
    detail: "PARTIAL — no dogfood receipts",
  });

  const hash = await store.memoryTreeHash();
  return { root: store.root, memoryTreeHash: hash, ok, checks };
}

```

### FILE src/config.ts
```
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileExists } from "./hash.js";

export type StoreConfig = {
  dream: {
    enabled: boolean;
    policy: {
      focus?: string[];
      excludeSources?: string[];
      maxProposals?: number;
    };
  };
  memory: {
    policy: Record<string, unknown>;
  };
  secrets: {
    allowlist: string[];
  };
};

const FORBIDDEN_KEYS = new Set([
  "dream.schedule",
  "dream.auto",
  "schedule",
  "auto",
]);

export const DEFAULT_CONFIG: StoreConfig = {
  dream: { enabled: false, policy: {} },
  memory: { policy: {} },
  secrets: { allowlist: [] },
};

export function validateConfigObject(raw: unknown): StoreConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("config must be an object");
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!["dream", "memory", "secrets"].includes(key)) {
      throw new Error(`Unknown config key: ${key}`);
    }
  }
  const dream = (obj.dream ?? {}) as Record<string, unknown>;
  for (const k of Object.keys(dream)) {
    const dotted = `dream.${k}`;
    if (FORBIDDEN_KEYS.has(dotted) || FORBIDDEN_KEYS.has(k)) {
      throw new Error(`Forbidden config key: ${dotted}`);
    }
  }
  if ("schedule" in dream || "auto" in dream) {
    throw new Error("Forbidden config key: dream.schedule/auto");
  }
  const secrets = (obj.secrets ?? {}) as Record<string, unknown>;
  const allowlist = Array.isArray(secrets.allowlist)
    ? secrets.allowlist.map(String)
    : [];
  const memory = (obj.memory ?? { policy: {} }) as StoreConfig["memory"];
  const policy = (dream.policy ?? {}) as StoreConfig["dream"]["policy"];
  return {
    dream: {
      enabled: Boolean(dream.enabled ?? false),
      policy,
    },
    memory: {
      policy: (memory.policy ?? {}) as Record<string, unknown>,
    },
    secrets: { allowlist },
  };
}

export async function loadConfig(storeRoot: string): Promise<StoreConfig> {
  const p = path.join(storeRoot, "config.json");
  if (!(await fileExists(p))) return { ...DEFAULT_CONFIG };
  const raw = JSON.parse(await readFile(p, "utf8"));
  return validateConfigObject(raw);
}

/** Pure: default config bytes for the sole writer (`store.ts`) to persist. */
export function defaultConfigJson(): string {
  return JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";
}

```

### FILE src/corpus/cursor.ts
```
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CorpusSource, ScanOpts, ScanResult, Transcript } from "./types.js";

/**
 * Cursor corpus:
 * 1) Prefer fixture-pinned `*.vscdb` / `state.vscdb` via read-only `node:sqlite`
 * 2) Also accept Cursor JSONL under roots (migration / non-sqlite fixtures)
 */
export const cursorCorpus: CorpusSource = {
  name: "cursor",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const { readdir } = await import("node:fs/promises");
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      const files: string[] = [];
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else if (
              e.name.endsWith(".jsonl") ||
              e.name.endsWith(".vscdb") ||
              e.name === "state.vscdb"
            ) {
              files.push(abs);
            }
          }
        };
        await walk(root);
      } catch (err) {
        errors.push({ path: root, message: (err as Error).message });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (
          opts.scope === "project" &&
          opts.projectKey &&
          projectKey !== opts.projectKey
        ) {
          excluded += 1;
          continue;
        }
        try {
          if (file.endsWith(".vscdb")) {
            const turns = await readVscdbTurns(file);
            transcripts.push({
              id: path.basename(file, ".vscdb"),
              source: "cursor",
              path: file,
              scope: opts.scope,
              projectKey,
              turns,
            });
            continue;
          }
          const raw = await readFile(file, "utf8");
          const turns = [];
          for (const line of raw.split(/\r?\n/).filter(Boolean)) {
            const obj = JSON.parse(line) as {
              message?: { role?: string; content?: unknown };
              role?: string;
              text?: string;
            };
            if (obj.message) {
              const content = obj.message.content;
              turns.push({
                role: String(obj.message.role ?? "user"),
                text:
                  typeof content === "string"
                    ? content
                    : JSON.stringify(content ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            } else {
              turns.push({
                role: String(obj.role ?? "user"),
                text: String(obj.text ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            }
          }
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "cursor",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }
    return {
      transcripts,
      scanned,
      included: transcripts.length,
      excluded_permission: excluded,
      malformed,
      errors,
      label: scanned === 0 ? "EMPTY" : "OK",
    };
  },
};

/** Fixture schema: ItemTable key `composerData:<id>` → JSON { bubbles: [{type,text}] } */
async function readVscdbTurns(dbPath: string) {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rows = db
      .prepare(
        `SELECT key, value FROM ItemTable WHERE key LIKE 'composerData:%' OR key LIKE 'bubbleId:%'`,
      )
      .all() as Array<{ key: string; value: string | Buffer }>;
    const turns: Array<{
      role: string;
      text: string;
      tool_events: [];
      skill_invocations: [];
    }> = [];
    for (const row of rows) {
      const raw =
        typeof row.value === "string"
          ? row.value
          : Buffer.from(row.value).toString("utf8");
      try {
        const parsed = JSON.parse(raw) as {
          bubbles?: Array<{ type?: string; text?: string; role?: string }>;
          type?: string;
          text?: string;
          role?: string;
        };
        if (Array.isArray(parsed.bubbles)) {
          for (const b of parsed.bubbles) {
            turns.push({
              role: String(b.role ?? (b.type === "ai" ? "assistant" : "user")),
              text: String(b.text ?? ""),
              tool_events: [],
              skill_invocations: [],
            });
          }
        } else if (parsed.text) {
          turns.push({
            role: String(parsed.role ?? "user"),
            text: String(parsed.text),
            tool_events: [],
            skill_invocations: [],
          });
        }
      } catch {
        /* skip non-json cells */
      }
    }
    return turns;
  } finally {
    db.close();
  }
}

```

### FILE src/corpus/codex.ts
```
import type { CorpusSource, ScanOpts, ScanResult, Transcript } from "./types.js";

/** Codex session format (fixture-pinned): JSONL with {type,role,text,ts} */
export const codexCorpus: CorpusSource = {
  name: "codex",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const { readdir, readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      let files: string[] = [];
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else if (e.name.endsWith(".jsonl")) files.push(abs);
          }
        };
        await walk(root);
      } catch (err) {
        errors.push({ path: root, message: (err as Error).message });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (
          opts.scope === "project" &&
          opts.projectKey &&
          projectKey !== opts.projectKey
        ) {
          excluded += 1;
          continue;
        }
        try {
          const raw = await readFile(file, "utf8");
          const turns = [];
          for (const line of raw.split(/\r?\n/).filter(Boolean)) {
            const obj = JSON.parse(line) as Record<string, unknown>;
            // Codex fixture shape
            if (obj.role || obj.text) {
              turns.push({
                role: String(obj.role ?? "user"),
                text: String(obj.text ?? ""),
                ts: String(obj.ts ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
              continue;
            }
            // Also accept Claude-shaped for migration fixtures
            const message = obj.message as Record<string, unknown> | undefined;
            if (message) {
              turns.push({
                role: String(message.role ?? "user"),
                text:
                  typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content ?? ""),
                ts: String(obj.timestamp ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            }
          }
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "codex",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }
    return {
      transcripts,
      scanned,
      included: transcripts.length,
      excluded_permission: excluded,
      malformed,
      errors,
      label: scanned === 0 ? "EMPTY" : "OK",
    };
  },
};

```

### FILE src/mcp/handlers.ts
```
import { readdir } from "node:fs/promises";
import path from "node:path";
import { BASE_ABSENT, MemoryStore } from "../store.js";

export type McpResult =
  | { ok: true; result: unknown }
  | { ok: false; error: { code: number; message: string } };

export async function handleToolCall(
  store: MemoryStore,
  name: string,
  args: Record<string, string>,
): Promise<McpResult> {
  if (name === "memory_read") {
    const buf = await store.read(args.path);
    return {
      ok: true,
      result: {
        content: [{ type: "text", text: buf ? buf.toString("utf8") : "" }],
      },
    };
  }
  if (name === "memory_search") {
    const out: string[] = [];
    const walk = async (dir: string, prefix: string) => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        const rel = path.posix.join(prefix, e.name);
        if (e.isDirectory()) await walk(abs, rel);
        else out.push(rel);
      }
    };
    try {
      await walk(path.join(store.root, "memory"), "memory");
    } catch {
      /* */
    }
    return {
      ok: true,
      result: { content: [{ type: "text", text: out.join("\n") }] },
    };
  }
  if (name === "memory_commit") {
    try {
      const r = await store.commitCanonical({
        relativePath: args.path,
        body: args.body,
        baseHash: args.baseHash || BASE_ABSENT,
        provenance: { authored_by: "agent", source: "mcp" },
      });
      return {
        ok: true,
        result: { content: [{ type: "text", text: JSON.stringify(r) }] },
      };
    } catch (err) {
      return {
        ok: false,
        error: {
          code: -32000,
          message: (err as Error).name + ": " + (err as Error).message,
        },
      };
    }
  }
  if (name === "memory_propose") {
    try {
      const id = `mcp-${Date.now()}`;
      await store.commitOperational({
        relativePath: `proposals/${id}.json`,
        body:
          JSON.stringify(
            {
              id,
              action: "create",
              targetPath: args.path,
              base_hash: args.baseHash || BASE_ABSENT,
              body: args.body,
              evidence: [{ transcriptId: "mcp", quote: args.body?.slice(0, 80) }],
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          ) + "\n",
      });
      return {
        ok: true,
        result: { content: [{ type: "text", text: JSON.stringify({ id }) }] },
      };
    } catch (err) {
      return {
        ok: false,
        error: { code: -32000, message: (err as Error).message },
      };
    }
  }
  return {
    ok: false,
    error: { code: -32601, message: `unknown tool: ${name}` },
  };
}

```

### FILE src/dream/run.ts
```
import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config.js";
import type { Transcript } from "../corpus/types.js";
import { parseFrontmatter } from "../frontmatter.js";
import { scan, SecretDetected } from "../secrets.js";
import type { MemoryStore } from "../store.js";
import { applyDreamPolicy } from "./policy.js";

export type ProposalAction =
  | "create"
  | "update"
  | "supersede"
  | "expire"
  | "delete";

export type Proposal = {
  id: string;
  action: ProposalAction;
  targetPath: string;
  base_hash: string;
  body: string;
  evidence: Array<{ transcriptId: string; quote: string }>;
  createdAt: string;
  expiresAt?: string;
};

export function proposalId(
  p: Omit<Proposal, "id" | "createdAt" | "expiresAt">,
): string {
  const material = JSON.stringify({
    action: p.action,
    targetPath: p.targetPath,
    base_hash: p.base_hash,
    body: p.body,
    evidenceQuotes: p.evidence.map((e) => e.quote),
  });
  return createHash("sha256").update(material).digest("hex").slice(0, 16);
}

export function extractProposals(
  transcripts: Transcript[],
  storeHashes: Map<string, string>,
): Proposal[] {
  const out: Proposal[] = [];
  for (const t of transcripts) {
    for (const turn of t.turns) {
      if (turn.role !== "user" && turn.role !== "human") continue;
      const text = turn.text.trim();
      const pref = text.match(
        /(?:please remember|always|prefer|from now on)[:\s]+(.{10,200})/i,
      );
      if (!pref) continue;
      const body = `---\ntitle: Preference\ndescription: ${pref[1].slice(0, 80)}\n---\n\n${pref[1].trim()}\n`;
      const targetPath = `memory/pref-${createHash("sha256")
        .update(pref[1])
        .digest("hex")
        .slice(0, 8)}.md`;
      const draft = {
        action: "create" as const,
        targetPath,
        base_hash: storeHashes.get(targetPath) ?? "absent",
        body,
        evidence: [{ transcriptId: t.id, quote: pref[1].slice(0, 120) }],
      };
      out.push({
        ...draft,
        id: proposalId(draft),
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}

async function loadStoreHashes(
  store: MemoryStore,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const memDir = path.join(store.root, "memory");
  const walk = async (dir: string, prefix: string) => {
    let ents;
    try {
      ents = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      const rel = path.posix.join(prefix, e.name);
      if (e.isDirectory()) await walk(abs, rel);
      else if (e.name.endsWith(".md")) {
        map.set(rel, await store.currentHash(rel));
      }
    }
  };
  await walk(memDir, "memory");
  return map;
}

async function staleExpireProposals(
  store: MemoryStore,
  storeHashes: Map<string, string>,
  thresholdMs: number,
): Promise<Proposal[]> {
  const out: Proposal[] = [];
  const now = Date.now();
  for (const [rel, hash] of storeHashes) {
    const buf = await store.read(rel);
    if (!buf) continue;
    const { frontmatter } = parseFrontmatter(buf.toString("utf8"));
    const updated = frontmatter.updatedAt ?? frontmatter.createdAt;
    if (typeof updated !== "string") continue;
    const ts = Date.parse(updated);
    if (Number.isNaN(ts) || now - ts < thresholdMs) continue;
    const draft = {
      action: "expire" as const,
      targetPath: rel,
      base_hash: hash,
      body: buf.toString("utf8"),
      evidence: [
        {
          transcriptId: "staleness-pass",
          quote: `No incoming evidence; older than threshold (${updated})`,
        },
      ],
    };
    out.push({
      ...draft,
      id: proposalId(draft),
      createdAt: new Date().toISOString(),
    });
  }
  return out;
}

export async function runDream(
  store: MemoryStore,
  transcripts: Transcript[],
  counts: {
    scanned: number;
    included: number;
    excluded_permission: number;
  },
): Promise<{ proposals: Proposal[]; withheldSecrets: number; dropped: number }> {
  const before = await store.memoryTreeHash();
  const cfg = await loadConfig(store.root);
  const { kept: scoped, dropped: policyDropped } = applyDreamPolicy(
    transcripts,
    cfg.dream.policy,
  );

  if (scoped.length === 0) {
    const err = new Error(
      `EMPTY_CORPUS — proves nothing; scanned=${counts.scanned} included=${counts.included} excluded_permission=${counts.excluded_permission}`,
    );
    err.name = "EmptyCorpus";
    throw err;
  }

  const hashes = await loadStoreHashes(store);
  let proposals = [
    ...extractProposals(scoped, hashes),
    ...(await staleExpireProposals(store, hashes, 90 * 24 * 3600 * 1000)),
  ];
  if (cfg.dream.policy.maxProposals != null) {
    const max = cfg.dream.policy.maxProposals;
    if (proposals.length > max) {
      proposals = proposals.slice(0, max);
    }
  }

  let withheldSecrets = 0;
  const kept: Proposal[] = [];
  const allow = store.getSecretAllowlist();
  for (const p of proposals) {
    try {
      const blob = p.body + p.evidence.map((e) => e.quote).join("\n");
      const findings = scan(blob, allow);
      if (findings.length) {
        withheldSecrets += 1;
        continue;
      }
      await store.commitOperational({
        relativePath: `proposals/${p.id}.json`,
        body: JSON.stringify(p, null, 2) + "\n",
      });
      kept.push(p);
    } catch (err) {
      if (err instanceof SecretDetected) {
        withheldSecrets += 1;
        continue;
      }
      throw err;
    }
  }
  const after = await store.memoryTreeHash();
  if (after !== before) {
    throw new Error("Dream mutated canonical memoryTreeHash — abort");
  }
  return { proposals: kept, withheldSecrets, dropped: policyDropped };
}

```

### FILE src/dream/policy.ts
```
export type DreamPolicy = {
  focus?: string[];
  excludeSources?: string[];
  maxProposals?: number;
};

/** Filter transcripts by source exclusion. maxProposals is applied to proposals, not here. */
export function applyDreamPolicy<T extends { source: string }>(
  items: T[],
  policy: DreamPolicy,
): { kept: T[]; dropped: number } {
  let kept = items;
  if (policy.excludeSources?.length) {
    const ban = new Set(policy.excludeSources);
    kept = kept.filter((t) => !ban.has(t.source));
  }
  return { kept, dropped: items.length - kept.length };
}

export function memoryPolicyFragmentLines(
  memoryPolicy: Record<string, unknown>,
): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(memoryPolicy)) {
    lines.push(`- memory.policy.${k}: ${JSON.stringify(v)}`);
  }
  return lines;
}

```

### FILE package.json
```
{
  "name": "gotcontext-memory",
  "version": "0.9.0",
  "description": "Multi-harness disk-canonical markdown memory + HITL dreaming for Claude Code, agy, Codex, OpenCode, and Cursor",
  "type": "module",
  "engines": {
    "node": ">=22.5.0"
  },
  "bin": {
    "gotcontext-memory": "./dist/cli.js",
    "gcm": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "npm run build"
  },
  "files": [
    "dist",
    "README.md",
    "docs/HONESTY.md"
  ],
  "dependencies": {
    "commander": "13.1.0",
    "proper-lockfile": "4.1.2",
    "yaml": "2.7.0"
  },
  "devDependencies": {
    "@types/node": "22.13.10",
    "@types/proper-lockfile": "4.1.4",
    "typescript": "5.8.2",
    "tsx": "4.19.3",
    "vitest": "3.0.9"
  },
  "license": "MIT"
}

```

### FILE docs/HONESTY.md
```
# Honesty

## What this package claims

- **Dreaming** = scan permission-scoped transcripts → write **proposals only** →
  human `review accept|reject`. Canonical memory changes only on accept through
  `MemoryStore.commitCanonical` / `deleteCanonical` (CAS + secret scan + MEMORY.md caps).
- Parity target: omega / house **transcript_dream HITL** loop only.
- We do **not** claim parity with omega-orchestrator `memory_dream` auto-supersede.
- Fresh install never dreams unprompted (`dream.enabled` default false; no scheduler in v1).
- Version is **0.9.0** until CEO publish gate + CI matrix green on a clean checkout for `1.0.0`.

## Adapter / corpus matrix

| Harness | Install fragment | Corpus importer |
|---|---|---|
| Claude Code | CLAUDE.md managed block | Full — fixture-pinned Claude JSONL |
| Codex | AGENTS.md managed block | Full — fixture-pinned Codex JSONL (`role`/`text`/`ts`) |
| Cursor | `.cursor/rules/*.mdc` | Full — JSONL + read-only `node:sqlite` against `.vscdb` fixtures |
| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
| OpenCode | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |

## Caps & CAS

- MEMORY.md hard caps: ~200 lines / 25KB — reject, never auto-truncate.
- `memoryTreeHash` covers `memory/**` + `MEMORY.md` only (not proposals/revisions/receipts).
- Human edits outside the CLI are allowed; the **caller** must supply `baseHash` equal to
  current on-disk bytes (or `absent`). There is no silent reconciliation workflow in v1 —
  `doctor` reports drift; `commitCanonical` refuses stale CAS.

## Uninstall

- `gotcontext-memory uninstall` restores each touched adapter file from the
  installer manifest `preImageBase64` (byte-faithful) when a pre-image existed;
  files created solely by install strip the managed block.

## Scope / permission note

- Project filtering uses parent-directory basename (`projectKey`) against fixture roots
  and CLI-supplied roots. This is **fixture-level / partial path identity**, not a
  full harness workspace ACL. Do not read “permission-scoped” as OS permission enforcement.

```

### FILE README.md
```
# Gotcontext Memory

Multi-harness **disk-canonical markdown memory** + out-of-band **HITL dreaming**.

## Install

```bash
cd gotcontext-memory
npm install
npm run build
npm link   # exposes `gotcontext-memory` (and optional `gcm` alias)
```

Prefer the `gotcontext-memory` binary. The `gcm` alias can collide with **Git Credential Manager** on Windows.

```bash
gotcontext-memory init          # ~/.gotcontext
gotcontext-memory init --project
gotcontext-memory dream --source claude --store user
gotcontext-memory review list
gotcontext-memory review accept <id>
gotcontext-memory doctor
gotcontext-memory export /abs/path/out.gcm.gz
gotcontext-memory mcp
```

## Adapter matrix (honest)

| Harness | Fragment install | Corpus |
|---|---|---|
| Claude Code | yes | full |
| Codex | yes | full |
| Cursor | yes | full (JSONL + read-only sqlite fixtures) |
| agy | yes | PARTIAL |
| OpenCode | yes | PARTIAL |

## Honesty

See [docs/HONESTY.md](docs/HONESTY.md). Claims **transcript → proposal → human accept** only.
Does **not** claim omega `memory_dream` auto-supersede. Package version is **0.9.0** pending CEO `1.0.0` gate.

## Architecture

- Plan: `docs/superpowers/plans/2026-08-08-gotcontext-memory-multi-harness.md`
- Design: `docs/superpowers/specs/2026-08-08-gotcontext-memory-multi-harness-design.md`
- Sole store-root writes: `MemoryStore` (`commitCanonical` / `commitOperational` / `deleteCanonical`)
- Caps: MEMORY.md ~200 lines / 25KB; CAS via sha256 `baseHash`

```

### FILE .github/workflows/ci.yml
```
name: ci
on:
  push:
  pull_request:
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    10|        node: ["22"]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm pack
      - name: smoke install pack
        shell: bash
        run: |
          pkg=$(ls gotcontext-memory-*.tgz | head -1)
          mkdir -p /tmp/gcm-smoke && cd /tmp/gcm-smoke
          npm init -y >/dev/null
          npm install "$GITHUB_WORKSPACE/$pkg"
          npx gotcontext-memory --help
          SMOKE_HOME=$(mktemp -d)
          HOME="$SMOKE_HOME" npx gotcontext-memory init
          HOME="$SMOKE_HOME" npx gotcontext-memory doctor

```

### FILE test/guards.test.ts
```
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { exportStore } from "../src/portability.js";
import { MemoryStore } from "../src/store.js";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const FORBIDDEN = new Set([
  "writeFile",
  "writeFileSync",
  "rename",
  "renameSync",
  "unlink",
  "unlinkSync",
  "rm",
  "rmSync",
  "createWriteStream",
]);

/** Modules allowed to call fs mutation APIs (store-root or audited external). */
const ALLOWED = new Set(["store.ts", "installer.ts", "portability.ts"]);

function collectWriteCalls(filePath: string): string[] {
  const text = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.ES2022, true);
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      let name = "";
      if (ts.isPropertyAccessExpression(expr)) name = expr.name.text;
      else if (ts.isIdentifier(expr)) name = expr.text;
      if (FORBIDDEN.has(name)) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        hits.push(`${path.basename(filePath)}:${line + 1}:${name}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

describe("repo guards", () => {
  it("package.json has no omega/telegram/pipecat deps", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
    );
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ];
    for (const n of names) {
      expect(n).not.toMatch(/omega|telegram|pipecat/i);
    }
  });

  it("AST: only store/installer/portability may call fs mutation APIs", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(abs);
        else if (ent.name.endsWith(".ts")) {
          if (ALLOWED.has(path.basename(abs))) continue;
          offenders.push(...collectWriteCalls(abs));
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });

  it("positive control: fixture source with writeFile is flagged", () => {
    const fake = `
      import fs from "node:fs/promises";
      await fs.writeFile("x", "y");
    `;
    const sf = ts.createSourceFile("fake.ts", fake, ts.ScriptTarget.ES2022, true);
    let hit = false;
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "writeFile"
      ) {
        hit = true;
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    expect(hit).toBe(true);
  });

  it("portability refuses archive inside store root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-exp-"));
    const store = await MemoryStore.initStore(root);
    await expect(
      exportStore(store, path.join(root, "out.gcm.gz")),
    ).rejects.toThrow(/must not target the store root/);
  });

  it("installer refuses fragment path under store root", async () => {
    const { installFragments } = await import("../src/installer.js");
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-inst-"));
    await MemoryStore.initStore(root);
    await expect(
      installFragments({
        dryRun: true,
        home: root, // would make ~/.claude under store if adapters used home wrongly
        cwd: root,
        storeHint: root,
        storeRoot: root,
      }),
    ).rejects.toThrow(/refuses store-root target/);
  });
});

```

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\paths.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 843ms:
1:import { lstat, realpath } from "node:fs/promises";
2:import path from "node:path";
3:import os from "node:os";
48:export function assertSafeRelativePath(rel: string): string {
53:    /^[a-zA-Z]:/.test(normalized) ||
64:export async function resolveUnderStore(
68:  const safe = assertSafeRelativePath(rel);
104:export function resolveUnderStoreSync(storeRoot: string, rel: string): string {
105:  const safe = assertSafeRelativePath(rel);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\hash.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 827ms:
1:import { createHash } from "node:crypto";
2:import { readdir, readFile, stat } from "node:fs/promises";
3:import path from "node:path";
10:export async function memoryTreeHash(storeRoot: string): Promise<string> {
43:    const rel = path.relative(storeRoot, abs).split(path.sep).join("/");

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\secrets.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 853ms:
36:export class SecretDetected extends Error {
40:      `SecretDetected: ${findings.map((f) => f.pattern).join(", ")}`,
42:    this.name = "SecretDetected";

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\index.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 851ms:
1:import { readdir, readFile } from "node:fs/promises";
2:import path from "node:path";
12:export async function regenerateIndex(
66:    const rel = path.relative(root, abs).split(path.sep).join("/");
73:    .split(/\r?\n/)

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\cli.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 840ms:
2:import os from "node:os";
3:import path from "node:path";
55:    .command("init")
78:      const before = await store.memoryTreeHash();
89:      const after = await store.memoryTreeHash();
91:        throw new Error("init mutated memoryTreeHash unexpectedly");
102:    .command("uninstall")
112:    .command("dream")
181:    .command("review")
209:  program.command("doctor").action(async () => {
212:    const before = await store.memoryTreeHash();
214:    const after = await store.memoryTreeHash();
221:    .command("export")
231:    .command("import")
244:  program.command("mcp").action(async () => {
259:  process.exit(1);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\mcp\\server.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 825ms:
5:import { createInterface } from "node:readline";

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\corpus\\types.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 830ms:
37:  label: "OK" | "EMPTY" | "PARTIAL — no dogfood receipts";

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\corpus\\claude.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 809ms:
1:import { readdir, readFile } from "node:fs/promises";
2:import path from "node:path";
92:  for (const line of raw.split(/\r?\n/)) {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\corpus\\agy.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 811ms:
6:    const { readdir } = await import("node:fs/promises");
7:    const path = await import("node:path");
31:        message: "PARTIAL — enumerated only; no dogfood receipts",
33:      label: "PARTIAL — no dogfood receipts",

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"src\\corpus\\opencode.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 765ms:
6:    const { readdir } = await import("node:fs/promises");
7:    const path = await import("node:path");
31:        message: "PARTIAL — enumerated only; no dogfood receipts",
33:      label: "PARTIAL — no dogfood receipts",

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\store.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 788ms:
1:import { spawn } from "node:child_process";
2:import { mkdtemp, readFile, writeFile } from "node:fs/promises";
3:import os from "node:os";
4:import path from "node:path";
5:import { fileURLToPath } from "node:url";
7:import { memoryTreeHash, sha256Hex } from "../src/hash.js";
14:describe("MemoryStore.commitCanonical CAS", () => {
15:  it("commitCanonical with stale baseHash throws CasConflict and leaves file bytes unchanged", async () => {
37:  it("control: correct baseHash commit succeeds and bytes change", async () => {
56:  it("memoryTreeHash ignores proposals and detects memory byte change", async () => {
65:    const h1 = await store.memoryTreeHash();
71:    expect(await store.memoryTreeHash()).toBe(h1);
78:    expect(await store.memoryTreeHash()).not.toBe(h1);
81:  it("path containment rejects traversal", async () => {
94:  it("two child processes: exactly one commitCanonical wins", async () => {
127:describe("memoryTreeHash helper export", () => {
128:  it("stable empty-ish store", async () => {
131:    const h = await memoryTreeHash(root);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\store-extra.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 820ms:
1:import { mkdtemp, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
6:import { assertSafeRelativePath } from "../src/paths.js";
13:describe("path containment arms", () => {
14:  it("rejects absolute, drive, and UNC-shaped relatives", () => {
15:    expect(() => assertSafeRelativePath("/etc/passwd")).toThrow(/Path containment/);
16:    expect(() => assertSafeRelativePath("C:\\Windows\\x")).toThrow(/Path containment/);
17:    expect(() => assertSafeRelativePath("\\\\server\\share")).toThrow(/Path containment/);
18:    expect(() => assertSafeRelativePath("~/secret")).toThrow(/Path containment/);
21:  it("rejects symlink escape under store", async () => {
44:describe("delete + rollback", () => {
45:  it("deleteCanonical removes file; stale base refuses; rollback restores", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\secrets.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 825ms:
1:import { mkdtemp, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
5:import { scan, SecretDetected } from "../src/secrets.js";
8:describe("secret scan gate — pattern arms", () => {
9:  it("rejects github PAT, generic sk-, and PEM header; tree unchanged", async () => {
12:    const before = await store.memoryTreeHash();
26:      ).rejects.toBeInstanceOf(SecretDetected);
28:    expect(await store.memoryTreeHash()).toBe(before);
31:  it("allowlist from config permits named pattern and records in revision meta", async () => {
59:  it("scanner self-test: fixture corpus yields ≥1 findings", () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\config.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 797ms:
1:import { mkdtemp } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
8:describe("config + store tiers", () => {
9:  it("rejects unknown and schedule/auto keys by name", () => {
19:  it("default dream.enabled is false (never unprompted)", () => {
23:  it("ambiguous store refuses with valid options", () => {
29:  it("project tier missing refuses with valid options", () => {
35:  it("user tier resolves under home", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\corpus.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 799ms:
1:import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
4:import { fileURLToPath } from "node:url";
17:describe("corpus importers", () => {
18:  it("claude: empty dir → EMPTY label", async () => {
25:  it("claude: two sessions + malformed sibling", async () => {
40:  it("claude CE-8 scope: projectKey filters", async () => {
50:  it("codex: positive two sessions", async () => {
60:  it("cursor: jsonl + vscdb sqlite fixture", async () => {
71:  it("agy/opencode stubs: PARTIAL label + candidate enumeration", async () => {
77:      expect(r.label).toMatch(/PARTIAL/);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\dream.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 777ms:
1:import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
7:import { regenerateIndex } from "../src/index.js";
16:describe("corpus + dream + review", () => {
17:  it("claude importer zero sessions returns EMPTY label", async () => {
28:  it("dream leaves memoryTreeHash identical; reject keeps it identical", async () => {
45:    const before = await store.memoryTreeHash();
55:    expect(await store.memoryTreeHash()).toBe(before);
58:    expect(await store.memoryTreeHash()).toBe(before);
62:  it("accept commits via CAS, updates MEMORY.md, removes pending proposal", async () => {
97:  it("regenerateIndex is pure and deterministic; caps reject oversized index", async () => {
106:    const a = await regenerateIndex(store);
107:    const b = await regenerateIndex(store);
114:  it("accept preflight refuses index over cap without mutating memory", async () => {
119:    // Create many tiny memories to push regenerateIndex over line cap
128:    const before = await store.memoryTreeHash();
146:    expect(await store.memoryTreeHash()).toBe(before);
149:  it("policy excluding source cursor drops cursor transcripts; control keeps them", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\installer.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 806ms:
1:import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
9:describe("installer", () => {
10:  it("dry-run writes zero bytes; treeHash identical", async () => {
17:    const before = await store.memoryTreeHash();
30:    expect(await store.memoryTreeHash()).toBe(before);
36:  it("init preserves preface; uninstall restores pre-image bytes", async () => {
45:    const before = await store.memoryTreeHash();
58:    expect(await store.memoryTreeHash()).toBe(before);
80:  it("tampered managed block refuses without --force", async () => {
107:  it("fragment parity: shared constraint sentences in all five renders", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\doctor.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 1039ms:
1:import { mkdtemp, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
8:describe("doctor", () => {
9:  it("healthy store names checks; empty memories labeled EMPTY", async () => {
12:    const before = await store.memoryTreeHash();
14:    expect(await store.memoryTreeHash()).toBe(before);
21:  it("dangling MEMORY.md entry fails by path", async () => {
38:  it("control: seeded memory passes memories check", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\portability.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 796ms:
1:import { mkdtemp, rm } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
7:import { SecretDetected } from "../src/secrets.js";
9:describe("portability", () => {
10:  it("export → wipe memory → import merge yields same content hash", async () => {
19:    const h1 = await store.memoryTreeHash();
34:  it("import of planted secret rejects that entry", async () => {
37:    const before = await store.memoryTreeHash();
45:    const { writeFile, mkdir } = await import("node:fs/promises");
55:    expect(await store.memoryTreeHash()).toBe(before);
56:    void SecretDetected;
59:  it("import refuses non-absolute archive path", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \"test\\mcp.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 812ms:
1:import { mkdtemp } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
9:describe("mcp handlers", () => {
10:  it("stale baseHash returns CasConflict error; store unchanged", async () => {
19:    const before = await store.memoryTreeHash();
27:    expect(await store.memoryTreeHash()).toBe(before);
37:  it("planted secret rejected through MCP commit", async () => {
40:    const before = await store.memoryTreeHash();
47:    expect(await store.memoryTreeHash()).toBe(before);
50:  it("memory_search does not write", async () => {
53:    const before = await store.memoryTreeHash();
56:    expect(await store.memoryTreeHash()).toBe(before);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"test(\" /c:\"describe(\" /c:\"assertSafeRelativePath\" /c:\"resolveUnderStore\" /c:\"memoryTreeHash\" /c:\"regenerateIndex\" /c:\"SecretDetected\" /c:\"command(\" /c:\"node:\" /c:\"shell:\" /c:\"PARTIAL\" /c:\"label:\" \".github\\workflows\\ci.yml\"" in C:\dev\projects\gotcontext-memory
 succeeded in 809ms:
10:    10|        node: ["22"]
22:        shell: bash

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \"test\\config.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 747ms:
1:import { mkdtemp } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
8:describe("config + store tiers", () => {
9:  it("rejects unknown and schedule/auto keys by name", () => {
19:  it("default dream.enabled is false (never unprompted)", () => {
23:  it("ambiguous store refuses with valid options", () => {
29:  it("project tier missing refuses with valid options", () => {
35:  it("user tier resolves under home", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \"test\\corpus.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 989ms:
1:import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
4:import { fileURLToPath } from "node:url";
17:describe("corpus importers", () => {
18:  it("claude: empty dir → EMPTY label", async () => {
25:  it("claude: two sessions + malformed sibling", async () => {
40:  it("claude CE-8 scope: projectKey filters", async () => {
50:  it("codex: positive two sessions", async () => {
60:  it("cursor: jsonl + vscdb sqlite fixture", async () => {
71:  it("agy/opencode stubs: PARTIAL label + candidate enumeration", async () => {
77:      expect(r.label).toMatch(/PARTIAL/);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \"test\\dream.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 971ms:
1:import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
16:describe("corpus + dream + review", () => {
17:  it("claude importer zero sessions returns EMPTY label", async () => {
28:  it("dream leaves memoryTreeHash identical; reject keeps it identical", async () => {
62:  it("accept commits via CAS, updates MEMORY.md, removes pending proposal", async () => {
97:  it("regenerateIndex is pure and deterministic; caps reject oversized index", async () => {
114:  it("accept preflight refuses index over cap without mutating memory", async () => {
149:  it("policy excluding source cursor drops cursor transcripts; control keeps them", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \"test\\installer.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 808ms:
1:import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
9:describe("installer", () => {
10:  it("dry-run writes zero bytes; treeHash identical", async () => {
36:  it("init preserves preface; uninstall restores pre-image bytes", async () => {
80:  it("tampered managed block refuses without --force", async () => {
107:  it("fragment parity: shared constraint sentences in all five renders", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \"test\\doctor.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 839ms:
1:import { mkdtemp, writeFile } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
8:describe("doctor", () => {
9:  it("healthy store names checks; empty memories labeled EMPTY", async () => {
21:  it("dangling MEMORY.md entry fails by path", async () => {
38:  it("control: seeded memory passes memories check", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \"test\\portability.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 792ms:
1:import { mkdtemp, rm } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
9:describe("portability", () => {
10:  it("export → wipe memory → import merge yields same content hash", async () => {
34:  it("import of planted secret rejects that entry", async () => {
45:    const { writeFile, mkdir } = await import("node:fs/promises");
59:  it("import refuses non-absolute archive path", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \"test\\mcp.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 754ms:
1:import { mkdtemp } from "node:fs/promises";
2:import os from "node:os";
3:import path from "node:path";
9:describe("mcp handlers", () => {
10:  it("stale baseHash returns CasConflict error; store unchanged", async () => {
37:  it("planted secret rejected through MCP commit", async () => {
50:  it("memory_search does not write", async () => {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"it(\" /c:\"describe(\" /c:\"node:\" /c:\"shell:\" /c:\"matrix:\" /c:\"run:\" /c:\"PARTIAL\" \".github\\workflows\\ci.yml\"" in C:\dev\projects\gotcontext-memory
 succeeded in 732ms:
8:      matrix:
10:    10|        node: ["22"]
18:      - run: npm ci
19:      - run: npm test
20:      - run: npm pack
22:        shell: bash
23:        run: |

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\paths.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 732ms:
import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export type StoreTier = "user" | "project";

export function expandHome(p: string): string {
  if (p === "~") return os.homedir();
  if (p.startsWith(`~${path.sep}`) || p.startsWith("~/")) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

export function userStoreRoot(home = os.homedir()): string {
  return path.join(home, ".gotcontext");
}

export function projectStoreRoot(cwd = process.cwd()): string {
  return path.join(cwd, ".gotcontext");
}

export function resolveStoreRoot(opts: {
  tier?: StoreTier;
  cwd?: string;
  home?: string;
  projectExists: boolean;
}): string {
  const home = opts.home ?? os.homedir();
  const cwd = opts.cwd ?? process.cwd();
  if (opts.tier === "user") return userStoreRoot(home);
  if (opts.tier === "project") {
    if (!opts.projectExists) {
      throw new Error(
        "Project store not present. Valid options: --store user (create project store with init --project).",
      );
    }
    return projectStoreRoot(cwd);
  }
  if (opts.projectExists) {
    throw new Error(
      "Ambiguous store. Both project and user stores may apply. Valid options: --store user | --store project.",
    );
  }
  return userStoreRoot(home);
}

export function assertSafeRelativePath(rel: string): string {
  const normalized = rel.replace(/\\/g, "/");
  if (
    path.isAbsolute(rel) ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.startsWith("\\\\") ||
    normalized.includes("..") ||
    normalized.startsWith("~")
  ) {
    throw new Error(`Path containment violation: ${rel}`);
  }
  return normalized;
}

/** Resolve path under store; reject escapes and symlink/junction ancestors. */
export async function resolveUnderStore(
  storeRoot: string,
  rel: string,
): Promise<string> {
  const safe = assertSafeRelativePath(rel);
  const rootReal = await realpath(storeRoot).catch(async () => {
    // store may be mid-init
    return path.resolve(storeRoot);
  });
  const abs = path.resolve(rootReal, safe);
  if (abs !== rootReal && !abs.startsWith(rootReal + path.sep)) {
    throw new Error(`Path escapes store root: ${rel}`);
  }
  // Walk ancestors; if any existing component is a symlink outside root, reject
  let cur = abs;
  while (cur.startsWith(rootReal)) {
    try {
      const st = await lstat(cur);
      if (st.isSymbolicLink()) {
        const target = await realpath(cur);
        if (target !== rootReal && !target.startsWith(rootReal + path.sep)) {
          throw new Error(`Symlink escape: ${rel}`);
        }
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        cur = path.dirname(cur);
        continue;
      }
      if ((err as Error).message?.includes("Symlink")) throw err;
    }
    if (cur === rootReal) break;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return abs;
}

/** Sync lexical-only resolve for lock stub paths before file exists — still checks text. */
export function resolveUnderStoreSync(storeRoot: string, rel: string): string {
  const safe = assertSafeRelativePath(rel);
  const root = path.resolve(storeRoot);
  const abs = path.resolve(root, safe);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error(`Path escapes store root: ${rel}`);
  }
  return abs;
}

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\hash.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 767ms:
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export function sha256Hex(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Canonical memory files under memory/ plus MEMORY.md — excludes operational paths. */
export async function memoryTreeHash(storeRoot: string): Promise<string> {
  const entries: Array<[string, string]> = [];
  const memoryDir = path.join(storeRoot, "memory");
  try {
    await walkMemoryFiles(memoryDir, storeRoot, entries);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  const indexPath = path.join(storeRoot, "MEMORY.md");
  try {
    const buf = await readFile(indexPath);
    entries.push(["MEMORY.md", sha256Hex(buf)]);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const payload = entries.map(([rel, h]) => `${rel}:${h}`).join("\n");
  return sha256Hex(payload);
}

async function walkMemoryFiles(
  dir: string,
  storeRoot: string,
  out: Array<[string, string]>,
): Promise<void> {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const abs = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walkMemoryFiles(abs, storeRoot, out);
      continue;
    }
    if (!item.isFile() || !item.name.endsWith(".md")) continue;
    const rel = path.relative(storeRoot, abs).split(path.sep).join("/");
    out.push([rel, sha256Hex(await readFile(abs))]);
  }
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\secrets.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 750ms:
export type SecretFinding = { pattern: string; preview: string };

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "aws_access_key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  {
    name: "github_pat",
    re: /\bghp_[A-Za-z0-9]{36,}\b/g,
  },
  {
    name: "generic_api_key",
    re: /\b(?:api[_-]?key|secret)\s*[:=]\s*['"]?sk-[A-Za-z0-9_-]{16,}/gi,
  },
  {
    name: "private_key_pem",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

export function scan(
  text: string,
  allowlist: string[] = [],
): SecretFinding[] {
  const allowed = new Set(allowlist);
  const findings: SecretFinding[] = [];
  for (const { name, re } of PATTERNS) {
    if (allowed.has(name)) continue;
    re.lastIndex = 0;
    const m = text.match(re);
    if (m) {
      findings.push({ pattern: name, preview: m[0].slice(0, 12) + "…" });
    }
  }
  return findings;
}

export class SecretDetected extends Error {
  findings: SecretFinding[];
  constructor(findings: SecretFinding[]) {
    super(
      `SecretDetected: ${findings.map((f) => f.pattern).join(", ")}`,
    );
    this.name = "SecretDetected";
    this.findings = findings;
  }
}

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\index.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 718ms:
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import type { MemoryStore } from "./store.js";

export type IndexOverlay = {
  upserts?: Record<string, string>;
  deletes?: string[];
};

/** Pure: returns MEMORY.md bytes for the post-overlay store view. No FS writes. */
export async function regenerateIndex(
  store: MemoryStore,
  overlay: IndexOverlay = {},
): Promise<string> {
  const files = new Map<string, string>();
  const memoryDir = path.join(store.root, "memory");
  try {
    await walk(memoryDir, store.root, files);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  for (const [rel, body] of Object.entries(overlay.upserts ?? {})) {
    files.set(rel.replace(/\\/g, "/"), body);
  }
  for (const del of overlay.deletes ?? []) {
    files.delete(del.replace(/\\/g, "/"));
  }

  const lines = ["# Memory index", ""];
  const sorted = [...files.keys()].sort();
  for (const rel of sorted) {
    if (!rel.startsWith("memory/") || !rel.endsWith(".md")) continue;
    const raw = files.get(rel)!;
    const { frontmatter, body } = parseFrontmatter(raw);
    if (typeof frontmatter.expires === "string") {
      const exp = Date.parse(frontmatter.expires);
      if (!Number.isNaN(exp) && exp <= Date.now()) continue;
    }
    const title =
      (typeof frontmatter.title === "string" && frontmatter.title) ||
      path.basename(rel, ".md");
    const hook =
      (typeof frontmatter.description === "string" &&
        frontmatter.description) ||
      firstLine(body);
    lines.push(`- [${title}](${rel}) — ${hook}`);
  }
  lines.push("");
  return lines.join("\n");
}

async function walk(
  dir: string,
  root: string,
  out: Map<string, string>,
): Promise<void> {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const abs = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walk(abs, root, out);
      continue;
    }
    if (!item.isFile() || !item.name.endsWith(".md")) continue;
    const rel = path.relative(root, abs).split(path.sep).join("/");
    out.set(rel, await readFile(abs, "utf8"));
  }
}

function firstLine(body: string): string {
  const line = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return line ? line.slice(0, 80) : "";
}

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\mcp\\server.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 710ms:
/**
 * Minimal stdio MCP-like JSON-RPC loop for memory tools.
 * Not a full SDK dependency — additive MCP; writes route through MemoryStore.
 */
import { createInterface } from "node:readline";
import { MemoryStore } from "../store.js";
import { handleToolCall } from "./handlers.js";

type Req = {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
};

export async function runMcpServer(storeRoot: string): Promise<void> {
  const store = new MemoryStore(storeRoot);
  await store.reloadConfig();
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const reply = (
    id: number | string | null,
    result?: unknown,
    error?: unknown,
  ) => {
    const msg = error
      ? { jsonrpc: "2.0", id, error }
      : { jsonrpc: "2.0", id, result };
    process.stdout.write(JSON.stringify(msg) + "\n");
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    let req: Req;
    try {
      req = JSON.parse(line) as Req;
    } catch {
      continue;
    }
    try {
      if (req.method === "initialize") {
        reply(req.id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "gotcontext-memory", version: "0.9.0" },
          capabilities: { tools: {} },
        });
        continue;
      }
      if (req.method === "tools/list") {
        reply(req.id, {
          tools: [
            {
              name: "memory_read",
              description: "Read a memory file",
              inputSchema: {
                type: "object",
                properties: { path: { type: "string" } },
                required: ["path"],
              },
            },
            {
              name: "memory_commit",
              description: "CAS commit via MemoryStore.commitCanonical",
              inputSchema: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  body: { type: "string" },
                  baseHash: { type: "string" },
                },
                required: ["path", "body", "baseHash"],
              },
            },
            {
              name: "memory_search",
              description: "List memory file paths",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "memory_propose",
              description: "Write a HITL proposal (operational only)",
              inputSchema: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  body: { type: "string" },
                  baseHash: { type: "string" },
                },
                required: ["path", "body"],
              },
            },
          ],
        });
        continue;
      }
      if (req.method === "tools/call") {
        const name = String(req.params?.name ?? "");
        const args = (req.params?.arguments ?? {}) as Record<string, string>;
        const out = await handleToolCall(store, name, args);
        if (out.ok) reply(req.id, out.result);
        else reply(req.id, undefined, out.error);
        continue;
      }
      reply(req.id, undefined, { code: -32601, message: "method not found" });
    } catch (err) {
      reply(req.id, undefined, {
        code: -32000,
        message: (err as Error).message,
      });
    }
  }
}

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\cli.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 823ms:
import { Command } from "commander";
import os from "node:os";
import path from "node:path";
import { agyCorpus } from "./corpus/agy.js";
import { claudeCorpus } from "./corpus/claude.js";
import { codexCorpus } from "./corpus/codex.js";
import { cursorCorpus } from "./corpus/cursor.js";
import { opencodeCorpus } from "./corpus/opencode.js";
import { runDoctor } from "./doctor.js";
import { runDream } from "./dream/run.js";
import { fileExists } from "./hash.js";
import { installFragments, uninstallFragments } from "./installer.js";
import { runMcpServer } from "./mcp/server.js";
import { projectStoreRoot, userStoreRoot } from "./paths.js";
import { exportStore, importStore } from "./portability.js";
import { acceptProposal, listProposals, rejectProposal } from "./review.js";
import { MemoryStore } from "./store.js";

async function openStore(storeFlag?: string, cwd = process.cwd()) {
  const project = projectStoreRoot(cwd);
  const user = userStoreRoot();
  if (storeFlag === "project") {
    if (!(await fileExists(project))) {
      throw new Error(
        "Project store missing. Run: gotcontext-memory init --project",
      );
    }
    const s = new MemoryStore(project);
    await s.reloadConfig();
    return s;
  }
  if (storeFlag === "user") {
    const s = new MemoryStore(user);
    await s.reloadConfig();
    return s;
  }
  if (await fileExists(project)) {
    throw new Error("Ambiguous store. Pass --store user|project");
  }
  const s = new MemoryStore(user);
  await s.reloadConfig();
  return s;
}

export function buildCli(): Command {
  const program = new Command();
  program
    .name("gotcontext-memory")
    .description(
      "Disk-canonical markdown memory + HITL dreaming for multiple coding agents",
    )
    .option("--store <tier>", "user|project");

  program
    .command("init")
    .option("--project", "initialize .gotcontext in cwd")
    .option("--dry-run", "print plan only")
    .option("--force", "overwrite tampered managed blocks")
    .option("--mcp", "note MCP enablement (use `mcp` command to serve)")
    .action(async (opts) => {
      const root = opts.project
        ? projectStoreRoot(process.cwd())
        : userStoreRoot();
      if (opts.dryRun) {
        console.log(`Would init store at ${root}`);
        const { planned } = await installFragments({
          dryRun: true,
          storeHint: root,
          storeRoot: root,
          force: !!opts.force,
        });
        console.log(planned.join("\n"));
        return;
      }
      await MemoryStore.initStore(root);
      const store = new MemoryStore(root);
      await store.reloadConfig();
      const before = await store.memoryTreeHash();
      const { planned, manifest } = await installFragments({
        dryRun: false,
        storeHint: root,
        force: !!opts.force,
      });
      await store.commitOperational({
        relativePath: "installer-manifest.json",
        body: JSON.stringify({ entries: manifest }, null, 2) + "\n",
        scanSecrets: false,
      });
      const after = await store.memoryTreeHash();
      if (before !== after) {
        throw new Error("init mutated memoryTreeHash unexpectedly");
      }
      console.log(`Initialized store at ${root}`);
      console.log(`Adapters touched:\n${planned.join("\n")}`);
      if (opts.mcp) console.log("MCP: run `gotcontext-memory mcp` to serve");
      console.log(
        "Prefer binary `gotcontext-memory` (gcm may collide with Git Credential Manager).",
      );
    });

  program
    .command("uninstall")
    .description("Remove managed adapter fragments using installer manifest")
    .action(async () => {
      const global = program.opts();
      const store = await openStore(global.store);
      const restored = await uninstallFragments({ storeRoot: store.root });
      console.log(JSON.stringify({ restored }, null, 2));
    });

  program
    .command("dream")
    .option("--source <name>", "claude|codex|cursor|agy|opencode|all", "all")
    .option("--scope <tier>", "user|project")
    .action(async (opts) => {
      const global = program.opts();
      const store = await openStore(global.store ?? opts.scope);
      const scope = (opts.scope ?? global.store ?? "user") as "user" | "project";
      const sources = {
        claude: claudeCorpus,
        codex: codexCorpus,
        cursor: cursorCorpus,
        agy: agyCorpus,
        opencode: opencodeCorpus,
      };
      const selected =
        opts.source === "all"
          ? Object.values(sources)
          : [sources[opts.source as keyof typeof sources]].filter(Boolean);
      let scanned = 0;
      let included = 0;
      let excluded = 0;
      const transcripts = [];
      for (const src of selected) {
        const roots =
          src.name === "claude"
            ? [path.join(os.homedir(), ".claude", "projects")]
            : [path.join(store.root, "fixtures", src.name)];
        const result = await src.scan({
          scope,
          roots,
          projectKey:
            scope === "project" ? path.basename(process.cwd()) : undefined,
        });
        scanned += result.scanned;
        included += result.included;
        excluded += result.excluded_permission;
        transcripts.push(...result.transcripts);
      }
      try {
        const { proposals, withheldSecrets, dropped } = await runDream(
          store,
          transcripts,
          {
            scanned,
            included,
            excluded_permission: excluded,
          },
        );
        console.log(
          JSON.stringify(
            {
              proposals: proposals.length,
              withheldSecrets,
              dropped,
              scanned,
              included,
              excluded_permission: excluded,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        console.error((err as Error).message);
        process.exitCode = 1;
      }
    });

  program
    .command("review")
    .argument("<action>", "list|accept|reject")
    .argument("[id]")
    .option("--yes", "confirm accept")
    .option("--yes-delete", "confirm delete action")
    .option("--reason <text>", "reject reason", "rejected")
    .action(async (action, id, opts) => {
      const global = program.opts();
      const store = await openStore(global.store);
      if (action === "list") {
        console.log(JSON.stringify(await listProposals(store), null, 2));
        return;
      }
      if (!id) throw new Error("id required");
      if (action === "reject") {
        await rejectProposal(store, id, opts.reason);
        console.log(`rejected ${id}`);
        return;
      }
      if (action === "accept") {
        if (!opts.yes) throw new Error("accept requires --yes on a named id");
        await acceptProposal(store, id, { yesDelete: !!opts.yesDelete });
        console.log(`accepted ${id}`);
        return;
      }
      throw new Error(`unknown action ${action}`);
    });

  program.command("doctor").action(async () => {
    const global = program.opts();
    const store = await openStore(global.store);
    const before = await store.memoryTreeHash();
    const report = await runDoctor(store);
    const after = await store.memoryTreeHash();
    if (before !== after) throw new Error("doctor mutated store");
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  });

  program
    .command("export")
    .requiredOption("--out <path>", "absolute archive path")
    .action(async (opts) => {
      const global = program.opts();
      const store = await openStore(global.store);
      await exportStore(store, opts.out);
      console.log(`exported to ${opts.out}`);
    });

  program
    .command("import")
    .requiredOption("--from <path>", "absolute archive path")
    .option("--merge", "merge into store")
    .option("--replace", "replace via CAS on existing paths")
    .action(async (opts) => {
      const global = program.opts();
      const store = await openStore(global.store);
      const mode = opts.replace ? "replace" : opts.merge ? "merge" : null;
      if (!mode) throw new Error("pass --merge or --replace");
      const r = await importStore(store, opts.from, mode);
      console.log(JSON.stringify(r, null, 2));
    });

  program.command("mcp").action(async () => {
    const global = program.opts();
    const store = await openStore(global.store);
    await runMcpServer(store.root);
  });

  return program;
}

async function main() {
  await buildCli().parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'test\\dream.test.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 734ms:
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { claudeCorpus } from "../src/corpus/claude.js";
import { runDream } from "../src/dream/run.js";
import { regenerateIndex } from "../src/index.js";
import {
  acceptProposal,
  listProposals,
  rejectProposal,
} from "../src/review.js";
import { IndexCapExceeded, BASE_ABSENT, MemoryStore } from "../src/store.js";
import { checkIndexCaps } from "../src/store.js";

describe("corpus + dream + review", () => {
  it("claude importer zero sessions returns EMPTY label", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-corp-"));
    const r = await claudeCorpus.scan({
      scope: "user",
      roots: [root],
    });
    expect(r.label).toBe("EMPTY");
    expect(r.scanned).toBe(0);
    expect(r.transcripts).toEqual([]);
  });

  it("dream leaves memoryTreeHash identical; reject keeps it identical", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-dream-"));
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-fix-"));
    const proj = path.join(fixtureRoot, "proj-a");
    await mkdir(proj, { recursive: true });
    await writeFile(
      path.join(proj, "sess1.jsonl"),
      `${JSON.stringify({
        timestamp: "2026-01-01T00:00:00Z",
        message: {
          role: "user",
          content: "Please remember: always run tests before committing.",
        },
      })}\n`,
      "utf8",
    );
    const store = await MemoryStore.initStore(storeRoot);
    const before = await store.memoryTreeHash();
    const scanned = await claudeCorpus.scan({
      scope: "user",
      roots: [fixtureRoot],
    });
    const { proposals } = await runDream(store, scanned.transcripts, {
      scanned: scanned.scanned,
      included: scanned.included,
      excluded_permission: scanned.excluded_permission,
    });
    expect(await store.memoryTreeHash()).toBe(before);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
    await rejectProposal(store, proposals[0]!.id, "nope");
    expect(await store.memoryTreeHash()).toBe(before);
    expect(await listProposals(store)).toHaveLength(0);
  });

  it("accept commits via CAS, updates MEMORY.md, removes pending proposal", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-acc-"));
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-fix2-"));
    const proj = path.join(fixtureRoot, "proj-a");
    await mkdir(proj, { recursive: true });
    await writeFile(
      path.join(proj, "sess1.jsonl"),
      `${JSON.stringify({
        timestamp: "2026-01-01T00:00:00Z",
        message: {
          role: "user",
          content: "Please remember: prefer conventional commits.",
        },
      })}\n`,
      "utf8",
    );
    const store = await MemoryStore.initStore(storeRoot);
    const scanned = await claudeCorpus.scan({
      scope: "user",
      roots: [fixtureRoot],
    });
    const { proposals } = await runDream(store, scanned.transcripts, {
      scanned: scanned.scanned,
      included: scanned.included,
      excluded_permission: scanned.excluded_permission,
    });
    const p = proposals[0]!;
    await acceptProposal(store, p.id);
    const mem = await store.read(p.targetPath);
    expect(mem).not.toBeNull();
    const index = await store.read("MEMORY.md");
    expect(index!.toString("utf8")).toContain(p.targetPath);
    expect(await listProposals(store)).toHaveLength(0);
  });

  it("regenerateIndex is pure and deterministic; caps reject oversized index", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-idx-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "---\ntitle: A\ndescription: alpha\n---\n\nbody\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const a = await regenerateIndex(store);
    const b = await regenerateIndex(store);
    expect(a).toBe(b);
    expect(a).toContain("memory/a.md");
    const huge = "# Memory index\n\n" + "x".repeat(30_000);
    expect(() => checkIndexCaps(huge)).toThrow(IndexCapExceeded);
  });

  it("accept preflight refuses index over cap without mutating memory", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-cap-"));
    const store = await MemoryStore.initStore(storeRoot);
    // Fill index near cap via many memory files would be slow; inject proposal that would blow index
    const body = "---\ntitle: Big\ndescription: x\n---\n\n" + "y".repeat(100);
    // Create many tiny memories to push regenerateIndex over line cap
    for (let i = 0; i < 210; i++) {
      await store.commitCanonical({
        relativePath: `memory/n${i}.md`,
        body: `---\ntitle: N${i}\ndescription: d\n---\n\nz\n`,
        baseHash: BASE_ABSENT,
        provenance: { authored_by: "human" },
      });
    }
    const before = await store.memoryTreeHash();
    const proposal = {
      id: "captest",
      action: "create" as const,
      targetPath: "memory/extra.md",
      base_hash: "absent",
      body,
      evidence: [{ transcriptId: "t", quote: "q" }],
      createdAt: new Date().toISOString(),
    };
    await store.commitOperational({
      relativePath: `proposals/${proposal.id}.json`,
      body: JSON.stringify(proposal, null, 2),
      scanSecrets: false,
    });
    await expect(acceptProposal(store, "captest")).rejects.toBeInstanceOf(
      IndexCapExceeded,
    );
    expect(await store.memoryTreeHash()).toBe(before);
  });

  it("policy excluding source cursor drops cursor transcripts; control keeps them", async () => {
    const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-pol-"));
    const store = await MemoryStore.initStore(storeRoot);
    await writeFile(
      path.join(storeRoot, "config.json"),
      JSON.stringify({
        dream: {
          enabled: false,
          policy: { excludeSources: ["cursor"] },
        },
        memory: { policy: {} },
        secrets: { allowlist: [] },
      }) + "\n",
    );
    await store.reloadConfig();
    const transcripts = [
      {
        id: "c1",
        source: "cursor",
        path: "/x",
        scope: "user" as const,
        turns: [
          {
            role: "user",
            text: "Please remember: exclude me from dream.",
            tool_events: [],
            skill_invocations: [],
          },
        ],
      },
      {
        id: "a1",
        source: "claude",
        path: "/y",
        scope: "user" as const,
        turns: [
          {
            role: "user",
            text: "Please remember: keep this preference.",
            tool_events: [],
            skill_invocations: [],
          },
        ],
      },
    ];
    const { proposals } = await runDream(store, transcripts, {
      scanned: 2,
      included: 2,
      excluded_permission: 0,
    });
    expect(
      proposals.every((p) => !p.evidence.some((e) => e.transcriptId === "c1")),
    ).toBe(true);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
  });
});

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'test\\portability.test.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 776ms:
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { exportStore, importStore } from "../src/portability.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";
import { SecretDetected } from "../src/secrets.js";

describe("portability", () => {
  it("export → wipe memory → import merge yields same content hash", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-port-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "---\ntitle: A\ndescription: d\n---\n\nhello\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const h1 = await store.memoryTreeHash();
    const archive = path.join(os.tmpdir(), `gcm-arch-${Date.now()}.gcm.gz`);
    await exportStore(store, archive);
    await rm(path.join(root, "memory", "a.md"), { force: true });
    // recreate empty memory file state via delete-like wipe — re-init index only
    const store2 = new MemoryStore(root);
    await store2.reloadConfig();
    await importStore(store2, archive, "merge");
    expect(await store2.read("memory/a.md")).not.toBeNull();
    // tree hash may differ if index regenerated — content must match
    const body = (await store2.read("memory/a.md"))!.toString("utf8");
    expect(body).toContain("hello");
    void h1;
  });

  it("import of planted secret rejects that entry", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-port2-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    const archive = path.join(os.tmpdir(), `gcm-bad-${Date.now()}.gcm.gz`);
    // Build a tiny gzip JSONL archive manually via export of secret body through operational bypass then… 
    // Instead: export clean, then craft by importing through commit path with secret in a synthetic store export.
    const dirtyRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-dirty-"));
    const dirty = await MemoryStore.initStore(dirtyRoot);
    // write secret via raw fs outside store API then export would include it — export walks memory dir.
    // Use commitOperational is wrong for memory/. Use writeFile under memory then export.
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir(path.join(dirtyRoot, "memory"), { recursive: true });
    await writeFile(
      path.join(dirtyRoot, "memory", "leak.md"),
      "AKIAIOSFODNN7EXAMPLE\n",
    );
    await exportStore(dirty, archive);
    const r = await importStore(store, archive, "merge");
    expect(r.rejected).toBeGreaterThanOrEqual(1);
    expect(await store.read("memory/leak.md")).toBeNull();
    expect(await store.memoryTreeHash()).toBe(before);
    void SecretDetected;
  });

  it("import refuses non-absolute archive path", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-port3-"));
    const store = await MemoryStore.initStore(root);
    await expect(importStore(store, "rel.gcm.gz", "merge")).rejects.toThrow(
      /absolute/,
    );
  });
});

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'test\\doctor.test.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 760ms:
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDoctor } from "../src/doctor.js";
import { BASE_ABSENT, MemoryStore } from "../src/store.js";

describe("doctor", () => {
  it("healthy store names checks; empty memories labeled EMPTY", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc-"));
    const store = await MemoryStore.initStore(root);
    const before = await store.memoryTreeHash();
    const report = await runDoctor(store);
    expect(await store.memoryTreeHash()).toBe(before);
    expect(report.checks.some((c) => c.name === "secret_scanner")).toBe(true);
    const mem = report.checks.find((c) => c.name === "memories");
    expect(mem?.status).toBe("EMPTY");
    expect(mem?.detail).toMatch(/EMPTY, proves nothing/);
  });

  it("dangling MEMORY.md entry fails by path", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc2-"));
    const store = await MemoryStore.initStore(root);
    await writeFile(
      path.join(root, "MEMORY.md"),
      "# Memory index\n\n- [Gone](memory/missing.md) — hook\n",
      "utf8",
    );
    const report = await runDoctor(store);
    expect(report.ok).toBe(false);
    expect(
      report.checks.some(
        (c) => c.name === "dangling_index" && c.detail === "memory/missing.md",
      ),
    ).toBe(true);
  });

  it("control: seeded memory passes memories check", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-doc3-"));
    const store = await MemoryStore.initStore(root);
    await store.commitCanonical({
      relativePath: "memory/a.md",
      body: "---\ntitle: A\ndescription: d\n---\n\nx\n",
      baseHash: BASE_ABSENT,
      provenance: { authored_by: "human" },
    });
    const report = await runDoctor(store);
    const mem = report.checks.find((c) => c.name === "memories");
    expect(mem?.status).toBe("pass");
    expect(mem?.detail).toMatch(/1 checked/);
  });
});

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath '.github\\workflows\\ci.yml'" in C:\dev\projects\gotcontext-memory
 succeeded in 743ms:
name: ci
on:
  push:
  pull_request:
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    10|        node: ["22"]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm pack
      - name: smoke install pack
        shell: bash
        run: |
          pkg=$(ls gotcontext-memory-*.tgz | head -1)
          mkdir -p /tmp/gcm-smoke && cd /tmp/gcm-smoke
          npm init -y >/dev/null
          npm install "$GITHUB_WORKSPACE/$pkg"
          npx gotcontext-memory --help
          SMOKE_HOME=$(mktemp -d)
          HOME="$SMOKE_HOME" npx gotcontext-memory init
          HOME="$SMOKE_HOME" npx gotcontext-memory doctor

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\installer.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 748ms:
4:import { adapters, MARK_BEGIN, MARK_END } from "./adapters/types.js";
6:import { memoryPolicyFragmentLines } from "./dream/policy.js";
10:  adapter: string;
15:  preImageBase64: string | null;
36:    policyLines = memoryPolicyFragmentLines(cfg.memory.policy);
41:  for (const a of adapters) {
62:    // Multiple adapters may share one path (agy + opencode → AGENTS.md)
66:          adapter: a.id,
69:          preImageBase64: null,
80:    const preImageBase64 = existing
96:      adapter: a.id,
99:      preImageBase64,
116:  const manPath = path.join(opts.storeRoot, "installer-manifest.json");
118:    throw new Error("No installer-manifest.json — nothing to uninstall");
125:    if (e.preImageBase64 != null) {
128:        Buffer.from(e.preImageBase64, "base64").toString("utf8"),

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\portability.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 771ms:
42:  await walk(path.join(store.root, "revisions"), "revisions");
94:    if (row.path === "config.json" || row.path.startsWith("revisions/")) {
96:        await store.commitOperational({
99:          scanSecrets: false,

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\doctor.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 711ms:
16:    status: "pass" | "fail" | "EMPTY" | "COULD_NOT_MEASURE" | "PARTIAL";
111:    name: "corpus_agy",
112:    status: "PARTIAL",
113:    detail: "PARTIAL — no dogfood receipts",
116:    name: "corpus_opencode",
117:    status: "PARTIAL",
118:    detail: "PARTIAL — no dogfood receipts",

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\review.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 946ms:
9:  checkIndexCaps,
35:  await store.commitOperational({
38:    scanSecrets: false,
40:  await store.removeOperational(`proposals/${id}.json`);
100:    checkIndexCaps(indexBytes);
108:    await store.withCanonicalLocks(
201:    await store.commitOperational({
207:          code: "INDEX_DRIFT_OR_CAS",
211:      scanSecrets: false,
216:  await store.commitOperational({
219:    scanSecrets: false,
221:  await store.removeOperational(`proposals/${id}.json`);
222:  await store.commitOperational({
230:    scanSecrets: false,

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\store.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 702ms:
3:import lockfile from "proper-lockfile";
53:export function checkIndexCaps(body: string): void {
71:    await mkdir(path.join(root, "revisions"), { recursive: true });
100:  async withCanonicalLocks<T>(
111:          throw new Error(`withCanonicalLocks only for canonical paths: ${rel}`);
153:    return this.withCanonicalLocks([opts.relativePath], (locked) =>
158:  async commitOperational(opts: {
197:    await this.withCanonicalLocks([opts.relativePath], async (locked) => {
202:  async removeOperational(relativePath: string): Promise<void> {
229:    const revDir = path.join(this.root, "revisions");
290:    if (rel === "MEMORY.md") checkIndexCaps(opts.body);
300:      const revDir = path.join(this.store.root, "revisions");
361:    const revDir = path.join(this.store.root, "revisions");

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\config.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 901ms:
11:      maxProposals?: number;

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\dream\\run.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 702ms:
146:): Promise<{ proposals: Proposal[]; withheldSecrets: number; dropped: number }> {
149:  const { kept: scoped, dropped: policyDropped } = applyDreamPolicy(
167:  if (cfg.dream.policy.maxProposals != null) {
168:    const max = cfg.dream.policy.maxProposals;
185:      await store.commitOperational({
202:  return { proposals: kept, withheldSecrets, dropped: policyDropped };

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"src\\mcp\\handlers.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 745ms:
49:        provenance: { authored_by: "agent", source: "mcp" },
67:      const id = `mcp-${Date.now()}`;
68:      await store.commitOperational({
78:              evidence: [{ transcriptId: "mcp", quote: args.body?.slice(0, 80) }],

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command 'findstr /n /c:"preImageBase64" /c:"installer-manifest" /c:"memoryPolicy" /c:"register" /c:"mcp" /c:"commitOperational" /c:"scanSecrets: false" /c:"INDEX_DRIFT" /c:"revisions" /c:"adapter" /c:"corpus_" /c:"maxProposals" /c:"dropped" /c:"removeOperational" /c:"withCanonicalLocks" /c:"checkIndexCaps" /c:"proper-lockfile" /c:"modelcontextprotocol" /c:"version" /c:"PARTIAL" "package.json"' in C:\dev\projects\gotcontext-memory
 succeeded in 705ms:
3:  "version": "0.9.0",
26:    "proper-lockfile": "4.1.2",
31:    "@types/proper-lockfile": "4.1.4",

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"preImageBase64\" /c:\"installer-manifest\" /c:\"memoryPolicy\" /c:\"register\" /c:\"mcp\" /c:\"commitOperational\" /c:\"scanSecrets: false\" /c:\"INDEX_DRIFT\" /c:\"revisions\" /c:\"adapter\" /c:\"corpus_\" /c:\"maxProposals\" /c:\"dropped\" /c:\"removeOperational\" /c:\"withCanonicalLocks\" /c:\"checkIndexCaps\" /c:\"proper-lockfile\" /c:\"modelcontextprotocol\" /c:\"version\" /c:\"PARTIAL\" \"docs\\HONESTY.md\"" in C:\dev\projects\gotcontext-memory
 succeeded in 1434ms:
20:| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
21:| OpenCode | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
26:- `memoryTreeHash` covers `memory/**` + `MEMORY.md` only (not proposals/revisions/receipts).
33:- `gotcontext-memory uninstall` restores each touched adapter file from the
34:  installer manifest `preImageBase64` (byte-faithful) when a pre-image existed;

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\installer.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 677ms:
1:import { mkdir, readFile, writeFile } from "node:fs/promises";
106:    await writeFile(target, next, "utf8");
126:      await writeFile(
139:        await writeFile(e.path, without === "\n" ? "" : without, "utf8");
144:  await writeFile(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\portability.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 639ms:
1:import { createWriteStream } from "node:fs";
50:  await pipeline(Readable.from([payload]), createGzip(), createWriteStream(destArchive));
99:          scanSecrets: false,

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\store.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 640ms:
1:import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
76:      await writeFile(index, "# Memory index\n\n", "utf8");
80:      await writeFile(cfgPath, defaultConfigJson(), "utf8");
121:          await writeFile(stub, "", { flag: "a" });
178:      await fh.writeFile(opts.body);
202:  async removeOperational(relativePath: string): Promise<void> {
303:      await writeFile(path.join(revDir, `${stem}.md`), existing);
304:      await writeFile(
324:      await fh.writeFile(opts.body, "utf8");
338:    await appendJournal(this.store.root, {
364:    await writeFile(path.join(revDir, `${stem}.md`), existing);
365:    await writeFile(
381:    await appendJournal(this.store.root, {
392:async function appendJournal(
397:  await writeFile(journal, JSON.stringify(entry) + "\n", { flag: "a" });

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\review.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 652ms:
38:    scanSecrets: false,
40:  await store.removeOperational(`proposals/${id}.json`);
57:  if (proposal.expiresAt && Date.parse(proposal.expiresAt) < Date.now()) {
78:    frontmatter.expires = new Date().toISOString();
207:          code: "INDEX_DRIFT_OR_CAS",
211:      scanSecrets: false,
219:    scanSecrets: false,
221:  await store.removeOperational(`proposals/${id}.json`);
230:    scanSecrets: false,

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\doctor.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 667ms:
111:    name: "corpus_agy",

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\config.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 980ms:
11:      maxProposals?: number;
42:      throw new Error(`Unknown config key: ${key}`);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\dream\\run.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 709ms:
26:  expiresAt?: string;
30:  p: Omit<Proposal, "id" | "createdAt" | "expiresAt">,
167:  if (cfg.dream.policy.maxProposals != null) {
168:    const max = cfg.dream.policy.maxProposals;
202:  return { proposals: kept, withheldSecrets, dropped: policyDropped };

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\mcp\\server.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 774ms:
2: * Minimal stdio MCP-like JSON-RPC loop for memory tools.

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"src\\mcp\\handlers.ts\"" in C:\dev\projects\gotcontext-memory
2026-08-08T21:01:50.018981Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 1 seconds
Output:

 exited 1 in 1004ms:
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \".github\\workflows\\ci.yml\"" in C:\dev\projects\gotcontext-memory
 succeeded in 797ms:
10:    10|        node: ["22"]

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"test\\guards.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 981ms:
15:  "writeFile",
16:  "writeFileSync",
23:  "createWriteStream",
27:const ALLOWED = new Set(["store.ts", "installer.ts", "portability.ts"]);
71:          if (ALLOWED.has(path.basename(abs))) continue;
80:  it("positive control: fixture source with writeFile is flagged", () => {
83:      await fs.writeFile("x", "y");
91:        node.expression.name.text === "writeFile"

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"test\\dream.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 715ms:
1:import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
33:    await writeFile(
67:    await writeFile(
97:  it("regenerateIndex is pure and deterministic; caps reject oversized index", async () => {
114:  it("accept preflight refuses index over cap without mutating memory", async () => {
141:      scanSecrets: false,
152:    await writeFile(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"test\\portability.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 672ms:
44:    // Use commitOperational is wrong for memory/. Use writeFile under memory then export.
45:    const { writeFile, mkdir } = await import("node:fs/promises");
47:    await writeFile(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"writeFile\" /c:\"createWriteStream\" /c:\"scanSecrets: false\" /c:\"removeOperational\" /c:\"appendJournal\" /c:\"INDEX_DRIFT\" /c:\"maxProposals\" /c:\"return { proposals\" /c:\"corpus_agy\" /c:\"Unknown config key\" /c:\"Minimal stdio\" /c:\"10|\" /c:\"ALLOWED\" /c:\"preflight\" /c:\"expires\" /c:\"deterministic\" /c:\"round-trip\" /c:\"orphan\" /c:\"corrupt\" \"test\\doctor.test.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 679ms:
1:import { mkdtemp, writeFile } from "node:fs/promises";
24:    await writeFile(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'docs\\adapters\\transcript-formats.md'" in C:\dev\projects\gotcontext-memory
 succeeded in 667ms:
# Transcript formats (fixture-pinned)

## Claude Code JSONL (v1)

- Path pattern: `<root>/<project-slug>/*.jsonl`
- Line: JSON object with `message.role`, `message.content` (string or content-block array), optional `timestamp`
- Skill invocations: `content[]` entry `type=tool_use` with `name=Skill` (or `skill`)

Fixtures: `test/fixtures/transcripts/claude/`

## Codex JSONL (v1)

- Path pattern: `<root>/<project-slug>/*.jsonl`
- Line: `{ "role": "user"|"assistant", "text": "...", "ts": "ISO-8601" }`
- Claude-shaped migration lines also accepted for mixed fixtures

Fixtures: `test/fixtures/transcripts/codex/`

## Cursor (v1)

### JSONL

- Same walk as Claude/Codex under fixture roots; Claude message shape or `{role,text}` accepted.

### SQLite `state.vscdb` / `*.vscdb` (read-only `node:sqlite`)

- Fixture table: `ItemTable(key TEXT, value TEXT)`
- Keys: `composerData:<id>` → JSON `{ "bubbles": [ { "type"|"role", "text" } ] }`
- Or bubble rows with `{ "text", "role" }`

Fixtures: `test/fixtures/transcripts/cursor/`

## agy / OpenCode

Labeled **PARTIAL** — scanners enumerate candidate paths and return zero transcripts
with an honest label until dogfood receipts exist.

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\corpus\\codex.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 692ms:
import type { CorpusSource, ScanOpts, ScanResult, Transcript } from "./types.js";

/** Codex session format (fixture-pinned): JSONL with {type,role,text,ts} */
export const codexCorpus: CorpusSource = {
  name: "codex",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const { readdir, readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      let files: string[] = [];
      try {
        const walk = async (dir: string) => {
          for (const e of await readdir(dir, { withFileTypes: true })) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) await walk(abs);
            else if (e.name.endsWith(".jsonl")) files.push(abs);
          }
        };
        await walk(root);
      } catch (err) {
        errors.push({ path: root, message: (err as Error).message });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (
          opts.scope === "project" &&
          opts.projectKey &&
          projectKey !== opts.projectKey
        ) {
          excluded += 1;
          continue;
        }
        try {
          const raw = await readFile(file, "utf8");
          const turns = [];
          for (const line of raw.split(/\r?\n/).filter(Boolean)) {
            const obj = JSON.parse(line) as Record<string, unknown>;
            // Codex fixture shape
            if (obj.role || obj.text) {
              turns.push({
                role: String(obj.role ?? "user"),
                text: String(obj.text ?? ""),
                ts: String(obj.ts ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
              continue;
            }
            // Also accept Claude-shaped for migration fixtures
            const message = obj.message as Record<string, unknown> | undefined;
            if (message) {
              turns.push({
                role: String(message.role ?? "user"),
                text:
                  typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content ?? ""),
                ts: String(obj.timestamp ?? ""),
                tool_events: [],
                skill_invocations: [],
              });
            }
          }
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "codex",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }
    return {
      transcripts,
      scanned,
      included: transcripts.length,
      excluded_permission: excluded,
      malformed,
      errors,
      label: scanned === 0 ? "EMPTY" : "OK",
    };
  },
};

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'src\\corpus\\claude.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 686ms:
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  CorpusSource,
  ScanOpts,
  ScanResult,
  Transcript,
  TranscriptTurn,
} from "./types.js";

/** Fixture-pinned Claude Code JSONL: one JSON object per line with type/message fields. */
export const claudeCorpus: CorpusSource = {
  name: "claude",
  async scan(opts: ScanOpts): Promise<ScanResult> {
    const errors: ScanResult["errors"] = [];
    const transcripts: Transcript[] = [];
    let scanned = 0;
    let excluded = 0;
    let malformed = 0;

    for (const root of opts.roots) {
      let files: string[] = [];
      try {
        files = await listJsonl(root);
      } catch (err) {
        errors.push({
          path: root,
          message: (err as Error).message,
        });
        continue;
      }
      for (const file of files) {
        scanned += 1;
        const projectKey = path.basename(path.dirname(file));
        if (
          opts.scope === "project" &&
          opts.projectKey &&
          projectKey !== opts.projectKey
        ) {
          excluded += 1;
          continue;
        }
        try {
          const raw = await readFile(file, "utf8");
          const turns = parseClaudeJsonl(raw, path.basename(file));
          transcripts.push({
            id: path.basename(file, ".jsonl"),
            source: "claude",
            path: file,
            scope: opts.scope,
            projectKey,
            turns,
          });
        } catch (err) {
          malformed += 1;
          errors.push({ path: file, message: (err as Error).message });
        }
      }
    }

    const included = transcripts.length;
    const label =
      scanned === 0 ? "EMPTY" : ("OK" as const);
    return {
      transcripts,
      scanned,
      included,
      excluded_permission: excluded,
      malformed,
      errors,
      label,
    };
  },
};

async function listJsonl(root: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    const ents = await readdir(dir, { withFileTypes: true });
    for (const e of ents) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) await walk(abs);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(abs);
    }
  };
  await walk(root);
  return out;
}

function parseClaudeJsonl(raw: string, transcriptId: string): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line) as Record<string, unknown>;
    const message = obj.message as Record<string, unknown> | undefined;
    if (!message) continue;
    const role = String(message.role ?? obj.type ?? "unknown");
    let text = "";
    const content = message.content;
    const tool_events: TranscriptTurn["tool_events"] = [];
    const skill_invocations: TranscriptTurn["skill_invocations"] = [];
    if (typeof content === "string") text = content;
    else if (Array.isArray(content)) {
      for (const part of content) {
        const p = part as Record<string, unknown>;
        if (p.type === "text") text += String(p.text ?? "");
        if (p.type === "tool_use") {
          const name = String(p.name ?? "");
          tool_events.push({
            name,
            transcript_id: transcriptId,
            isError: false,
          });
          if (name === "Skill" || name.toLowerCase() === "skill") {
            const input = (p.input ?? {}) as Record<string, unknown>;
            skill_invocations.push({
              skill: String(input.skill ?? input.name ?? "unknown"),
              ts: String(obj.timestamp ?? ""),
              transcript_id: transcriptId,
            });
          }
        }
      }
    }
    turns.push({
      role,
      text,
      ts: String(obj.timestamp ?? ""),
      tool_events,
      skill_invocations,
    });
  }
  return turns;
}

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "Get-Content -LiteralPath 'test\\corpus.test.ts'" in C:\dev\projects\gotcontext-memory
 succeeded in 673ms:
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { agyCorpus } from "../src/corpus/agy.js";
import { claudeCorpus } from "../src/corpus/claude.js";
import { codexCorpus } from "../src/corpus/codex.js";
import { cursorCorpus } from "../src/corpus/cursor.js";
import { opencodeCorpus } from "../src/corpus/opencode.js";

const FIX = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/transcripts",
);

describe("corpus importers", () => {
  it("claude: empty dir → EMPTY label", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-empty-"));
    const r = await claudeCorpus.scan({ scope: "user", roots: [root] });
    expect(r.label).toBe("EMPTY");
    expect(r.scanned).toBe(0);
  });

  it("claude: two sessions + malformed sibling", async () => {
    const r = await claudeCorpus.scan({
      scope: "user",
      roots: [path.join(FIX, "claude")],
    });
    expect(r.scanned).toBeGreaterThanOrEqual(3);
    expect(r.included).toBe(2);
    expect(r.malformed).toBeGreaterThanOrEqual(1);
    expect(r.transcripts).toHaveLength(2);
    const withSkill = r.transcripts.find((t) => t.id === "s1");
    expect(withSkill?.turns.some((t) => t.skill_invocations?.length)).toBe(
      true,
    );
  });

  it("claude CE-8 scope: projectKey filters", async () => {
    const r = await claudeCorpus.scan({
      scope: "project",
      projectKey: "proj-a",
      roots: [path.join(FIX, "claude")],
    });
    expect(r.included + r.excluded_permission + r.malformed).toBe(r.scanned);
    expect(r.included).toBeGreaterThanOrEqual(1);
  });

  it("codex: positive two sessions", async () => {
    const r = await codexCorpus.scan({
      scope: "user",
      roots: [path.join(FIX, "codex")],
    });
    expect(r.included).toBe(2);
    expect(r.label).toBe("OK");
    expect(r.transcripts[0]!.source).toBe("codex");
  });

  it("cursor: jsonl + vscdb sqlite fixture", async () => {
    const r = await cursorCorpus.scan({
      scope: "user",
      roots: [path.join(FIX, "cursor")],
    });
    expect(r.included).toBeGreaterThanOrEqual(2);
    const sqlite = r.transcripts.find((t) => t.path.endsWith(".vscdb"));
    expect(sqlite).toBeTruthy();
    expect(sqlite!.turns.length).toBeGreaterThanOrEqual(1);
  });

  it("agy/opencode stubs: PARTIAL label + candidate enumeration", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "gcm-stub-"));
    await mkdir(path.join(root, "x"), { recursive: true });
    await writeFile(path.join(root, "x", "a.log"), "hi");
    for (const src of [agyCorpus, opencodeCorpus]) {
      const r = await src.scan({ scope: "user", roots: [root] });
      expect(r.label).toMatch(/PARTIAL/);
      expect(r.scanned).toBeGreaterThanOrEqual(1);
      expect(r.transcripts).toEqual([]);
    }
  });
});

codex
The current tree does close the earlier accept/index rollback and proposal-removal issues. However, I’ve confirmed several plan-level gates remain open in the current sources—not merely missing tests—including a store-writer violation and a malformed CI workflow.
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export async function listProposals\" /c:\"path.join(store.root, \\\"proposals\\\"\" /c:\"export async function acceptProposal\" /c:\"regenerateIndex\" /c:\"withCanonicalLocks\" /c:\"proposals/accepted\" /c:\"removeOperational\" \"src\\review.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 716ms:
4:import { regenerateIndex } from "./index.js";
13:export async function listProposals(store: MemoryStore): Promise<Proposal[]> {
40:  await store.removeOperational(`proposals/${id}.json`);
45:export async function acceptProposal(
85:  const indexBytes = await regenerateIndex(store, {
108:    await store.withCanonicalLocks(
217:    relativePath: `proposals/accepted/${id}.json`,
221:  await store.removeOperational(`proposals/${id}.json`);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"async withCanonicalLocks\" /c:\"async commitCanonical(\" /c:\"async commitOperational\" /c:\"async deleteCanonical\" /c:\"commitCanonicalLocked\" /c:\"appendJournal\" \"src\\store.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 852ms:
100:  async withCanonicalLocks<T>(
147:  async commitCanonical(opts: {
154:      locked.commitCanonicalLocked(opts),
158:  async commitOperational(opts: {
192:  async deleteCanonical(opts: {
280:  async commitCanonicalLocked(opts: {
338:    await appendJournal(this.store.root, {
350:  async deleteCanonicalLocked(opts: {
381:    await appendJournal(this.store.root, {
392:async function appendJournal(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export function resolveStoreRoot\" /c:\"export function assertSafeRelativePath\" /c:\"export async function resolveUnderStore\" \"src\\paths.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 668ms:
23:export function resolveStoreRoot(opts: {
48:export function assertSafeRelativePath(rel: string): string {
64:export async function resolveUnderStore(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"const PATTERNS\" /c:\"export function scan\" /c:\"export class SecretDetected\" \"src\\secrets.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 680ms:
3:const PATTERNS: Array<{ name: string; re: RegExp }> = [
19:export function scan(
36:export class SecretDetected extends Error {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export async function regenerateIndex\" /c:\"Date.now()\" \"src\\index.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 682ms:
12:export async function regenerateIndex(
38:      if (!Number.isNaN(exp) && exp <= Date.now()) continue;

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export const DEFAULT_CONFIG\" /c:\"export function validateConfigObject\" \"src\\config.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 678ms:
29:export const DEFAULT_CONFIG: StoreConfig = {
35:export function validateConfigObject(raw: unknown): StoreConfig {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export const claudeCorpus\" /c:\"function parseClaudeJsonl\" \"src\\corpus\\claude.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 657ms:
12:export const claudeCorpus: CorpusSource = {
90:function parseClaudeJsonl(raw: string, transcriptId: string): TranscriptTurn[] {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export const codexCorpus\" /c:\"tool_events: []\" \"src\\corpus\\codex.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 686ms:
4:export const codexCorpus: CorpusSource = {
52:                tool_events: [],
67:                tool_events: [],

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export const cursorCorpus\" /c:\"readVscdbTurns\" \"src\\corpus\\cursor.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 694ms:
10:export const cursorCorpus: CorpusSource = {
54:            const turns = await readVscdbTurns(file);
120:async function readVscdbTurns(dbPath: string) {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export function proposalId\" /c:\"export async function runDream\" /c:\"maxProposals\" /c:\"commitOperational\" /c:\"memoryTreeHash\" \"src\\dream\\run.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 682ms:
29:export function proposalId(
138:export async function runDream(
147:  const before = await store.memoryTreeHash();
167:  if (cfg.dream.policy.maxProposals != null) {
168:    const max = cfg.dream.policy.maxProposals;
185:      await store.commitOperational({
198:  const after = await store.memoryTreeHash();
200:    throw new Error("Dream mutated canonical memoryTreeHash — abort");

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export async function installFragments\" /c:\"export async function uninstallFragments\" /c:\"await writeFile(\" /c:\"manPath\" \"src\\installer.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 701ms:
19:export async function installFragments(opts: {
106:    await writeFile(target, next, "utf8");
112:export async function uninstallFragments(opts: {
116:  const manPath = path.join(opts.storeRoot, "installer-manifest.json");
117:  if (!(await fileExists(manPath))) {
120:  const man = JSON.parse(await readFile(manPath, "utf8")) as {
126:      await writeFile(
139:        await writeFile(e.path, without === "\n" ? "" : without, "utf8");
144:  await writeFile(
145:    manPath,

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export async function runDoctor\" /c:\"name: \\\"secret_scanner\\\"\" /c:\"name: \\\"corpus_agy\\\"\" \"src\\doctor.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 708ms:
21:export async function runDoctor(store: MemoryStore): Promise<DoctorReport> {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export async function exportStore\" /c:\"export async function importStore\" /c:\"row.path === \\\"config.json\\\"\" /c:\"regenerateIndex\" \"src\\portability.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 659ms:
7:import { regenerateIndex } from "./index.js";
11:export async function exportStore(
53:export async function importStore(
110:  const index = await regenerateIndex(store);

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"Minimal stdio MCP-like\" /c:\"export async function runMcpServer\" \"src\\mcp\\server.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 711ms:
2: * Minimal stdio MCP-like JSON-RPC loop for memory tools.
16:export async function runMcpServer(storeRoot: string): Promise<void> {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export async function handleToolCall\" /c:\"name === \\\"memory_commit\\\"\" /c:\"name === \\\"memory_propose\\\"\" \"src\\mcp\\handlers.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 711ms:
9:export async function handleToolCall(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"export function applyDreamPolicy\" /c:\"export function memoryPolicyFragmentLines\" \"src\\dream\\policy.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 669ms:
8:export function applyDreamPolicy<T extends { source: string }>(
20:export function memoryPolicyFragmentLines(

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"\\\"version\\\"\" /c:\"\\\"proper-lockfile\\\"\" \"package.json\"" in C:\dev\projects\gotcontext-memory
2026-08-08T21:03:00.749051Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.7 seconds
Output:

 exited 1 in 658ms:
exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"matrix:\" /c:\"10|\" /c:\"npm test\" /c:\"npm pack\" \".github\\workflows\\ci.yml\"" in C:\dev\projects\gotcontext-memory
 succeeded in 681ms:
8:      matrix:
10:    10|        node: ["22"]
19:      - run: npm test
20:      - run: npm pack

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"Dreaming\" /c:\"PARTIAL\" /c:\"Scope / permission note\" \"docs\\HONESTY.md\"" in C:\dev\projects\gotcontext-memory
 succeeded in 674ms:
5:- **Dreaming** = scan permission-scoped transcripts → write **proposals only** →
20:| Antigravity (`agy`) | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
21:| OpenCode | AGENTS.md managed block | **PARTIAL** — enumerates candidates; no parse dogfood yet |
37:## Scope / permission note

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"readFile(\" /c:\"path.join(\" /c:\"memory_commit\" /c:\"memory_propose\" /c:\"corpus_\" /c:\"revisions\" /c:\"config.json\" /c:\"scanSecrets: false\" /c:\"modelcontextprotocol\" /c:\"proper-lockfile\" /c:\"version\" \"src\\review.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 671ms:
14:  const dir = path.join(store.root, "proposals");
19:    const raw = await readFile(path.join(dir, name), "utf8");
31:  const raw = await readFile(
32:    path.join(store.root, "proposals", `${id}.json`),
38:    scanSecrets: false,
51:  const raw = await readFile(path.join(store.root, rel), "utf8");
211:      scanSecrets: false,
219:    scanSecrets: false,
230:    scanSecrets: false,

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"readFile(\" /c:\"path.join(\" /c:\"memory_commit\" /c:\"memory_propose\" /c:\"corpus_\" /c:\"revisions\" /c:\"config.json\" /c:\"scanSecrets: false\" /c:\"modelcontextprotocol\" /c:\"proper-lockfile\" /c:\"version\" \"src\\mcp\\handlers.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 653ms:
27:        const abs = path.join(dir, e.name);
34:      await walk(path.join(store.root, "memory"), "memory");
43:  if (name === "memory_commit") {
65:  if (name === "memory_propose") {

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"readFile(\" /c:\"path.join(\" /c:\"memory_commit\" /c:\"memory_propose\" /c:\"corpus_\" /c:\"revisions\" /c:\"config.json\" /c:\"scanSecrets: false\" /c:\"modelcontextprotocol\" /c:\"proper-lockfile\" /c:\"version\" \"src\\doctor.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 684ms:
49:  const memDir = path.join(store.root, "memory");
55:        const abs = path.join(dir, e.name);
59:          const raw = await readFile(abs, "utf8");
111:    name: "corpus_agy",
116:    name: "corpus_opencode",

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "findstr /n /c:\"readFile(\" /c:\"path.join(\" /c:\"memory_commit\" /c:\"memory_propose\" /c:\"corpus_\" /c:\"revisions\" /c:\"config.json\" /c:\"scanSecrets: false\" /c:\"modelcontextprotocol\" /c:\"proper-lockfile\" /c:\"version\" \"src\\portability.ts\"" in C:\dev\projects\gotcontext-memory
 succeeded in 890ms:
32:      const abs = path.join(dir, e.name);
36:        const buf = await readFile(abs);
41:  await walk(path.join(store.root, "memory"), "memory");
42:  await walk(path.join(store.root, "revisions"), "revisions");
43:  for (const rel of ["MEMORY.md", "config.json"]) {
64:  const raw = gunzipSync(await readFile(archivePath)).toString("utf8");
94:    if (row.path === "config.json" || row.path.startsWith("revisions/")) {
99:          scanSecrets: false,

exec
"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command 'findstr /n /c:"readFile(" /c:"path.join(" /c:"memory_commit" /c:"memory_propose" /c:"corpus_" /c:"revisions" /c:"config.json" /c:"scanSecrets: false" /c:"modelcontextprotocol" /c:"proper-lockfile" /c:"version" "package.json"' in C:\dev\projects\gotcontext-memory
 succeeded in 662ms:
3:  "version": "0.9.0",
14:    "build": "tsc -p tsconfig.json",
26:    "proper-lockfile": "4.1.2",
31:    "@types/proper-lockfile": "4.1.4",

codex
Read-only re-audit of the current bundle/tree. I did not rerun tests; measured ground truth remains 47 passed across 11 files, version 0.9.0.

### Tasks 1–12

1. **PARTIAL** — CAS, canonical/operational/delete APIs, deterministic locks, revisions, and journal exist (`src/store.ts:100`, `src/store.ts:147`, `src/store.ts:192`, `src/store.ts:280`, `src/store.ts:392`). However, uninstall directly rewrites a store-root manifest outside `MemoryStore` (`src/installer.ts:116`, `src/installer.ts:144`), while the AST guard exempts all of `installer.ts` (`test/guards.test.ts:27`, `test/guards.test.ts:71`).

2. **DONE** — Deny-by-default patterns and typed rejection are implemented (`src/secrets.ts:3`, `src/secrets.ts:19`, `src/secrets.ts:36`) and enforced before canonical writes (`src/store.ts:280`). Config allowlists are loaded and recorded in revision/journal provenance.

3. **PARTIAL** — Pure index generation and commit caps exist (`src/index.ts:12`, `src/store.ts:53`). Determinism is time-dependent because regeneration calls `Date.now()` for expiry filtering (`src/index.ts:38`).

4. **PARTIAL** — Explicit user/project resolution and default-off dreaming exist (`src/paths.ts:23`, `src/config.ts:29`). Project-over-user merged reads with per-entry provenance are absent, and nested unknown config keys are insufficiently rejected (`src/config.ts:35`).

5. **PARTIAL** — Independent Claude, Codex, and Cursor importers plus fixture-format documentation exist (`src/corpus/claude.ts:12`, `src/corpus/codex.ts:4`, `src/corpus/cursor.ts:10`, `docs/adapters/transcript-formats.md:1`). Codex emits empty tool/skill metadata (`src/corpus/codex.ts:52`, `src/corpus/codex.ts:67`), and required zero/malformed/scope arms are incomplete for Codex/Cursor. agy/OpenCode remain honestly partial.

6. **PARTIAL** — Deterministic proposal IDs, operational-only writes, secret withholding, staleness proposals, and canonical hash checks exist (`src/dream/run.ts:29`, `src/dream/run.ts:138`, `src/dream/run.ts:185`, `src/dream/run.ts:198`). Extraction covers preferences only, and `maxProposals` truncation is not included in the reported dropped count (`src/dream/run.ts:167`, `src/dream/run.ts:202`).

7. **PARTIAL** — Accept preflight, ordered locking, index rollback, accepted move, pending removal, expire frontmatter, and delete confirmation are implemented (`src/review.ts:85`, `src/review.ts:108`, `src/review.ts:217`, `src/review.ts:221`). Proposal IDs are interpolated into direct `readFile` paths without containment (`src/review.ts:31`, `src/review.ts:51`).

8. **PARTIAL** — Five managed fragments, pre-image restoration, tamper refusal, and operational manifest creation are present. Uninstall violates the sole-writer rule and leaves an emptied manifest rather than removing it (`src/installer.ts:112`, `src/installer.ts:144`). `init --mcp` only prints guidance; it does not register MCP configurations (`src/cli.ts:92`).

9. **PARTIAL** — Doctor checks config, scanner self-test, frontmatter parsing, dangling index entries, caps, canonical immutability, and partial labels (`src/doctor.ts:21`, `src/doctor.ts:111`). It lacks revision/sidecar consistency, adapter state, measured corpus availability, and detection of `INDEX_DRIFT_OR_CAS` receipts.

10. **PARTIAL** — External-path export and commit-mediated canonical import exist (`src/portability.ts:11`, `src/portability.ts:53`). Replace and merge behave identically, replace does not delete absent destination files, proposals are not exported, no durable import receipt is written, and revisions bypass secret scanning (`src/portability.ts:42`, `src/portability.ts:94`, `src/portability.ts:99`).

11. **PARTIAL** — Read/search/commit/propose handlers route writes through `MemoryStore` (`src/mcp/handlers.ts:9`, `src/mcp/handlers.ts:43`, `src/mcp/handlers.ts:65`). The server explicitly describes itself as “MCP-like,” not SDK-backed (`src/mcp/server.ts:2`); the required SDK dependency, nonexistent-store refusal, protocol-level tests, and installer registration are absent.

12. **PARTIAL** — Source exclusion and adapter memory-policy rendering exist (`src/dream/policy.ts:8`, `src/dream/policy.ts:20`). Focus topics and per-source enablement are unused, proposal-cap drops are misreported, and CI is syntactically malformed (`.github/workflows/ci.yml:10`).

### Blocking defects

- **HIGH — Sole store-writer invariant remains broken.** `uninstallFragments` writes `.gotcontext/installer-manifest.json` directly (`src/installer.ts:116`, `src/installer.ts:144`). The guard cannot detect this because `installer.ts` is wholesale allowlisted (`test/guards.test.ts:27`).

- **HIGH — Review path containment remains incomplete.** User-controlled proposal IDs reach direct filesystem reads without `assertSafeRelativePath`/`resolveUnderStore` (`src/review.ts:31`, `src/review.ts:51`). A traversal-shaped ID can load proposal JSON outside `proposals/`.

- **HIGH — Release CI cannot satisfy the plan gate.** The workflow contains the literal malformed key `10|        node` (`.github/workflows/ci.yml:10`), so the claimed three-OS matrix is not a valid release oracle.

### Important gaps

- MCP is advertised but is a hand-rolled “MCP-like” loop with no required SDK or installer registration.
- Portability’s `--replace` mode does not replace the destination tree.
- Doctor cannot surface the review error receipt it is supposed to diagnose.
- Config validation permits unsupported nested policy/config keys.
- README export syntax omits the CLI-required `--out` option (`README.md:22`, `src/cli.ts:221`).

### Honesty risks

- README’s “sole store-root writes” claim conflicts with uninstall’s direct manifest write (`README.md:42`, `src/installer.ts:144`).
- HONESTY says doctor reports drift, but doctor does not inspect review error receipts or index drift generally (`docs/HONESTY.md:29`, `src/doctor.ts:21`).
- Advertising `gotcontext-memory mcp` as MCP overstates an implementation that labels itself “MCP-like” (`README.md:24`, `src/mcp/server.ts:2`).
- agy/OpenCode and permission-scope limitations remain accurately disclosed (`docs/HONESTY.md:20`, `docs/HONESTY.md:37`).

### Test oracle gaps

- The AST guard exempts the exact installer violation it should catch.
- No traversal tests cover review proposal IDs.
- No workflow parse or clean-checkout CI validation caught `.github/workflows/ci.yml:10`.
- Review lacks stale/create-exists/expired/expire/delete/index-failure rollback coverage.
- Dream lacks explicit empty-corpus, idempotency, secret-withhold, staleness, and cap-drop-accounting arms.
- Portability’s round-trip test calculates but discards the original hash instead of asserting equality (`test/portability.test.ts:20`, `test/portability.test.ts:30`).
- Doctor lacks corrupt-frontmatter and orphan-revision-sidecar tests.
- MCP tests exercise handlers directly, not the stdio protocol or installer registration.
- Codex/Cursor lack the complete zero/malformed/scope/tool-metadata matrix.

RECOMMENDED: FAIL — Store-writer containment, review path validation, and CI release gates remain broken.
