# Chairman synthesis — gotcontext-memory multi-harness design

**Council:** 20260808_155453 · **Chairman:** Composer (this session) · **Seat 1 model:** claude-fable-5  
**Verdict-bearing seats:** 4/8 (claude, codex, agy, copilot) — all **C**  
**Absent (infra, not dissent):** droid×3 (`DROID` default path missing), cursor (`MISSING_CLI` in tt_council despite `~/.local/bin/agent` present)

## Per-seat verdict matrix

| Seat | Verdict | Evidence quality | Notes |
|---|---|---|---|
| claude | **C** | High — cites plan.md / omega spec paths, concrete tree | Spine candidate |
| codex | **C** | High — CAS/MCP both, installer flags, importers | Strong deltas |
| agy | **C** | Med-high — read failures on fable-audit (UTF-16) + skill path | Keep C; discard unread-file fabrication risk on those two paths |
| copilot | **C** | Med — aligns; weaker file:line | Deltas on honesty boundary |
| droid×3 | EMPTY | — | Path 127 — not votes |
| cursor | MISSING_CLI | — | Not a vote |

## Select-then-merge

**Spine:** Claude seat (clearest v1 = B-subset of C; daemon optional later; package tree).

**Verified deltas folded in:**
- From **codex:** MCP + file mounts (both); `MemoryStore.commit()` sole write API; installer `--dry-run`/`--uninstall`/`doctor`; revisions dir; corpus importers per harness.
- From **agy:** CAS sha256 + atomic rename as v1 store primitive; Node single installer.
- From **copilot:** Explicit honesty: claim “dreaming” only for HITL transcript loop, never auto-facts supersede; export/import portability.

## 5-section categorization

### 1. Full Consensus
- Pick **C** (disk canonical + optional daemon).
- Markdown memory plane; no omega-jarvis required for v1.
- Dreaming = out-of-band proposals + **HITL accept/reject**; never silent transcript→memory apply.
- Default-OFF for any auto-dream schedule.
- Shared installer writes harness-native fragments for all five tools.
- Do not port Telegram / voice / speaker-gate / `OMEGA_FACTS_DB`.

### 2. Partial Agreement
- **CAS depth in v1:** Claude says atomic write + base_hash on accept; Codex/agy push full CAS+revisions as blocking. **Resolution:** v1 ships content-hash CAS + revision sidecars on commit (fable CE-2/14/15) — blocking, not phase-2.
- **MCP in v1:** Codex/agy want shared MCP; Claude emphasizes file mounts first. **Resolution:** v1 ships file mounts for all five + MCP server for harnesses that register MCP; dream works without MCP.
- **Corpus coverage:** Claude notes v1 may ship Claude+Codex importers first. **Resolution:** all five *adapters* ship in v1; corpus importers may land Claude+Codex+Cursor first with honest “partial corpus” labels for agy/OpenCode until dogfood receipts exist.

### 3. Disagreement
None among verdict seats on A/B/C.

### 4. Unique Findings
- Claude: v1 ships CLI-only dream (daemon = v1.1 invoking same CLI — never second write path).
- Codex: SQLite only as rebuildable search cache, never second writable truth.
- Copilot: index caps + staleness/delete policy blocking for honesty.

### 5. Comprehensive Analysis
Ship **hybrid C**: `~/.gotcontext/` (or project `.gotcontext/`) markdown store with MEMORY.md caps, CAS commits, secret scan, dream CLI → proposals, `gcm review` HITL, optional later daemon that only queues. Five harness adapters = managed instruction fragments + optional MCP. Honesty boundary = transcript_dream HITL parity claim only.

## 7-failure-mode checklist
1. Minority Correct — no dissenting verdict seats; infra absences only.
2. Synthesis Override — no new claims beyond seats + required-reading facts.
3. Correlated Hallucination — C repeated across providers with distinct rationales (daemon friction vs set-and-forget) — not template echo.
4. Domain gap — seats cited plan/omega paths; skill file unread by some — HITL-vs-auto taken from question ground truth + skill already loaded this session.
5. Phantom Failure — droid/cursor correctly excluded from consensus count.
6. Writer-Reader — no seat proposed deleting shared handles.
7. Sycophantic Convergence — phrasing differs (CLI-only vs MCP-both); substance aligns.

## Ship decision
**APPROVE C** as the design spine. Present design to user for section approval (brainstorming gate), then write spec + implementation plan.
