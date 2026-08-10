# Backlog — gotcontext-memory (complete list)

**As of:** 2026-08-10 (main tip includes efficacy + stratified window + BL-DRM-016 closed; **105+ tests**)  
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
