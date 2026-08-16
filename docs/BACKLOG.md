# Backlog — gotcontext-memory (complete list)

**As of:** 2026-08-15 (BL-DRM-020 landed; BL-DRM-021/024 resolved by audit as not applicable to this architecture; 022/023 remain open. Background: `research/2026-08-14-self-evolution-sweep.md`)  
**Version:** 0.9.0  
**Rule:** If it is open work, it is on this list. Closed work belongs in audits/CHANGELOG, not here.

Status tags: `OPEN` | `BLOCKED` | `PARKED` | `DONE` | `CLOSED`

Junior rebuild: [`guides/rebuild-from-scratch.md`](./guides/rebuild-from-scratch.md).

---

## Merge hygiene

| ID | Item | Status | Notes |
|---|---|---|---|
| BL-MRG-001 | Untangle co-mingled digest + deep-dive land | DONE | Main tip `6ecf0c9` |
| BL-MRG-002 | gitignore `.tensor-grep/` and drop from tree | DONE | |
| BL-MRG-003 | Land CEO/docs/skills wave with merge | DONE | |

---

## A. Release / ops

| ID | Item | Status |
|---|---|---|
| BL-REL-001 | CEO publish gate for `1.0.0` | BLOCKED |
| BL-REL-002 | Reconcile stale plan checkboxes | OPEN |
| BL-REL-003 | Docker matrix gating vs operator-only | OPEN |
| BL-REL-004 | npm publish | BLOCKED |
| BL-REL-005 | Dependabot / lockfile hygiene | OPEN |

## B. Dream / HITL

| ID | Item | Status | Notes |
|---|---|---|---|
| BL-DRM-001 | LLM / full omega transcript_dream parity | PARKED | Not an LLM brain |
| BL-DRM-002 | Semantic merge across phrasings | OPEN | String-key prevalence only |
| BL-DRM-011 | Streaming digests + bounded heap | DONE | |
| BL-DRM-012 | Cross-session prevalence proposals | DONE | |
| BL-DRM-013 | Suppress rejected + accepted resurrection | DONE | rejected=`claimKey`; accepted prefs=path presence |
| BL-DRM-014 | maxProposals by evidence strength | DONE | |
| BL-DRM-015 | `--max-sessions` window (default 400) | DONE | now **stratified** (L22) |
| BL-DRM-016 | Re-wire Cursor `.vscdb` into digest path | **CLOSED 2026-08-10** | shared `classifyText` |
| BL-DRM-017 | Efficacy loop for accepted pattern notes | DONE | `efficacy` CLI; L23 |
| BL-DRM-018 | Concurrent digest workers | DONE | default 8 |
| BL-DRM-019 | YAML-safe note frontmatter (`yamlScalar`) | DONE | L24 |
| BL-DRM-003 | Schema honesty create\|expire producers | OPEN | |
| BL-DRM-004 | MCP propose share proposalId + policy | OPEN | |
| BL-DRM-006 | Guides catch up `--force` / sources[] | DONE | rebuild + dream/efficacy docs 2026-08-10 |
| BL-DRM-007 | Queue-only daemon v1.1 | PARKED | |
| BL-DRM-008 | Session-level health denylist | OPEN | |
| BL-DRM-009 | PC omega: stop pong proposals | OPEN | |
| BL-DRM-010 | PC omega: memory_dream stall | OPEN | |
| BL-DRM-020 | `reads_post` retrieval telemetry in `efficacy` | **DONE 2026-08-15** | `digest.noteMemoryRead` counts Read tool calls opening `memory/…` or `MEMORY.md`; `efficacy` reports `reads_post` and sets `recommend_deliver` on `PERSISTING + reads 0`; `report` emits an `undelivered` item naming the surfaces to move the rule to. Delivery outranks mechanization — a note nobody opened has not been tried. Uninstrumented digests score `undefined`, never `0`. |
| BL-DRM-021 | Seeded canary in any automated review stage | **N/A here (2026-08-15 audit)** | Requires an automated reviewer to calibrate. This toolkit is HITL: proposals are accepted by a human via `review` / `report` + `ingest-decisions`, and the only optional automation is the triage adapter in `report.ts`, which already fails OPEN to the human. Revisit only if an auto-accept path is ever added. |
| BL-DRM-022 | Weekly CONSOLIDATION (region-rewrite) tier | OPEN | Re-read one ragged memory region; merge overlaps, supersede contradicted notes, expire mechanized-RESOLVED ones; survival requires re-synthesis (Auto-Dreamer 2605.20616). Emit per-note CAS-gated proposals, never one giant write. |
| BL-DRM-025 | Surface evidence PROJECTS on a proposal, and gate user-tier writes on disclosure | OPEN | Proposals carry `evidence[].transcriptId` but not the projectKey behind each one, so a human accepting into a **user** store cannot see that a note was distilled from three different projects. Add `evidenceProjects: string[]` (outside the `proposalId` hash, so ids are stable) and show it in `review list` / `report.html`. Then treat a user-tier accept as a **disclosure** decision, not just a generalization: the note is loaded alongside every project afterwards, so flag bodies carrying project-identifying strings (repo names, absolute paths, client names). Project scope already read-filters the corpus (`scope === "project"` → `projectKey === basename(cwd)`), which is the stronger half and is why the leak surface here is the user tier only. Python-runtime precedent + rationale: `research/2026-08-14-self-evolution-sweep.md`. |
| BL-DRM-024 | Note-shaped validators must exempt index files | **CLOSED — not reproducible here (2026-08-15 audit)** | Audited `store.ts`, `frontmatter.ts`, `review.ts`. No frontmatter-required validator exists: `parseFrontmatter` returns an empty map for a body without a header rather than rejecting it, the only index-specific check (`checkIndexCaps`) is already scoped to `MEMORY.md`, and `MEMORY.md` is **regenerated** from the note tree by `regenerateIndex` rather than written by a proposal — so a proposal cannot carry an index body at all. Consequence worth stating: the BL-DRM-020 remedy takes a different shape here. The always-loaded surface is the index **hook**, which is the note's `description`, so an undelivered rule is fixed by rewriting that field (an ordinary `update` proposal), not by writing the index. |
| BL-DRM-023 | Escalation lifecycle dedup + collision-safe archive moves | OPEN | Re-minting a denied escalation nightly collided with its own archive (WinError 183) and aborted triage fail-open in the Python runtime. Suppress re-mint across applied/denied/approved; archive moves must overwrite (`os.replace` semantics). |

## C. Corpus

| ID | Item | Status |
|---|---|---|
| BL-CRP-001 | Full agy parser | OPEN |
| BL-CRP-002 | Full OpenCode parser | OPEN |
| BL-CRP-003 | Codex/Cursor richer metadata | OPEN |
| BL-CRP-004 | Stronger projectKey ACL | OPEN |
| BL-CRP-005 | Doctor live corpus scans | OPEN |
| BL-CRP-006 | Adapter detect() / `--adapters` | OPEN |
| BL-CRP-007 | truncated ≠ malformed everywhere | OPEN |

## D. Store / security (still OPEN)

BL-SEC-001 import allowlist trust · BL-SEC-002 gunzip caps · BL-SEC-003 path fail-closed · BL-SEC-004 post-lock revalidate · BL-SEC-005 journal lock · BL-SEC-006 Windows case paths · BL-SEC-007 YAML budget · BL-SEC-008 uninstall hash check · BL-SEC-009 MCP orphan index · BL-SEC-010 lock stale 10s.

**DONE on main (`6ecf0c9`):** github_pat_ + related scanner gaps; receiptCode specificity; listProposals corrupt isolation; MCP `allowCommit` default-off.

## E. Portability (OPEN)

BL-PRT-001 installer-manifest export · BL-PRT-002 proposal round-trip · BL-PRT-003 replace delete failure counts · BL-PRT-004 init --mcp registration.

## F. Doctor / MCP / CLI (OPEN / PARKED)

BL-DOC-001..003 doctor depth · BL-DOC-004 MCP SDK PARKED · BL-DOC-005 lifecycle · BL-DOC-006 dream --strict.

## G. Tests (OPEN)

BL-TST-001 coverage CI · BL-TST-002 AST positive control · BL-TST-003 fixture INDEX · BL-TST-004 faster cap seed · BL-TST-005 more HITL arms · BL-TST-006 disk secrets fixtures.

## H. Product / config

BL-CFG-001 merged project+user OPEN · BL-CFG-002..004 PARKED (org/cloud/sqlite cache).

## I. Research

BL-RSH-001 LLM parity scope · BL-RSH-002 PC pong · BL-RSH-003 memory_dream stall · BL-RSH-004 Exa wiring · BL-RSH-005 Mem0/Zep/Letta · BL-RSH-006 allowCommit profiles.

---

## Closed reference

- Deep-dive CRITICAL/HIGH: `docs/audits/2026-08-09-gotcontext-memory-deep-dive.md`
- Digest/prevalence: main `6ecf0c9` + `docs/HONESTY.md` dreaming section
