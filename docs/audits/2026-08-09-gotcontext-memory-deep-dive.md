# Deep-dive audit register — 2026-08-09

**Mode:** Audit + fix P0/P1 (Wave A–C shipped same session)  
**Baseline prior:** codex round-5 (2026-08-08) claimed no HIGH blockers  
**Verification:** `npm test` 66 passed; `biome check --write`; `tsc` build green  
**Thinktank:** `tt_smoke` 8/8; `tt_quick` infra FAILED (PROVIDER_FAILURE / STRUCTURED_INVALID); 3-lens Workflow → **APPROVE_WITH_NITS** (concurrent A2 oracle + MCP config matrix folded into impl)

## Competitive / prior-art refresh (WebSearch; Exa MCP/key unavailable)

- OWASP LLM01 / LLM04; Agentic ASI06 memory poisoning
- Mem0 `memory-dream` consolidation with HITL diffs — different substrate (API) vs markdown CAS
- Edge cases baked into tests: pong/health preference FPs; origin-bound HITL; inert doctor gates

## Finding disposition

| ID | Severity | Wave2 | Status | Evidence |
|---|---|---|---|---|
| DD-STORE-001 | CRITICAL | VERIFIED | **FIXED** | `src/store.ts` always locks `locks/<sha256(rel)>.lock`; `test/store.test.ts` create↔delete race |
| DD-DREAM-001 | CRITICAL | VERIFIED | **FIXED** | `src/review.ts` regenerates MEMORY.md under lock; `test/review.test.ts` concurrent accepts |
| DD-STORE-002 / DD-TEST-001 | HIGH | VERIFIED | **FIXED** | `test/store-extra.test.ts` imports `symlink`; EPERM-only skip |
| DD-DREAM-002 | HIGH | VERIFIED | **FIXED** | `extractProposals` requires please-remember/from-now-on + deny pong/ping/health; `test/dream.test.ts` |
| DD-DREAM-003 | HIGH | VERIFIED | **FIXED** | Action allowlist + throw; `test/review.test.ts` |
| DD-CLI-001 | HIGH | VERIFIED | **FIXED** | `memory_read` scoped to MEMORY.md\|memory/** |
| DD-CLI-002 | HIGH | VERIFIED | **FIXED** | `mcp.allowCommit` default false; propose path kept; docs/HONESTY |
| DD-CLI-003 | HIGH | VERIFIED | **FIXED** | `corpusScanLabel`; PARTIAL when scanned>0 included=0 |
| DD-CLI-005 / DD-STORE-006 | HIGH | VERIFIED | **FIXED** | Doctor `index_caps` fails over cap |
| DD-TEST-002 | HIGH | VERIFIED | **FIXED** | Dream exclude control arm without excludeSources |
| DD-STORE-004 | HIGH | VERIFIED | **FIXED** | `openai_sk` + `env_sk` patterns; clean-body control |
| DD-DREAM-004 | MEDIUM | VERIFIED | **FIXED** | Invalid expiresAt fail-closed |
| DD-STORE-008 | MEDIUM | VERIFIED | **FIXED** | `countIndexLines` CR/unicode seps |
| DD-CLI-004 / DD-CLI-007 | MEDIUM | VERIFIED | **FIXED** | Dream CLI sources[] + `--force` / enabled gate |
| DD-DREAM-012 | LOW | VERIFIED | **FIXED** | Sort by proposalId before maxProposals slice |
| DD-DREAM-007 | MEDIUM | VERIFIED | **FIXED** | Receipt codes CAS_CONFLICT / SECRET_DETECTED / INDEX_CAP |
| Export proposals / installer-manifest | MEDIUM | — | **DEFERRED** | Prior Important; backlog |
| agy/OpenCode parsers | — | — | **DEFERRED** | PARTIAL honesty unchanged |
| LLM transcript_dream parity | — | — | **DEFERRED** | HONESTY v1 regex only |
| Import allowlist / gunzip caps | MEDIUM | — | **DEFERRED** | Security follow-up |

## Re-audit note

CRITICAL/HIGH cards from Wave 1 that were in-scope for this remediation are **FIXED** with bidirectional tests where specified. No CRITICAL reopen observed under `npm test` after lint/format/build.
