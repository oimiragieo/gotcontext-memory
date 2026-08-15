# Self-evolution research sweep — 2026-08-14

Exa sweep over sleep-time/offline memory consolidation and self-evolving-agent
work, run while unifying the private Python runtime (one engine over Claude
Code JSONL + OpenCode SQLite). Everything below is prompt/harness-level — no
weight updates — so it maps directly onto this toolkit.

## Papers and what we take from each

| Source | Core idea | What it maps to here |
|---|---|---|
| **Auto-Dreamer** (arXiv 2605.20616) | Two-timescale memory: fast append-only writer + slow offline consolidator using **region rewriting** — a memory entry survives only if the consolidator re-synthesizes it; counterfactual credit marks load-bearing vs redundant entries. 12x smaller memory bank at higher success rate. | BL-DRM-022 consolidation tier. Append-only stores rot; periodic region rewrite with survival-by-resynthesis is the cure. Keep every rewrite as per-note CAS-gated proposals. |
| **ACE — Agentic Context Engineering** (arXiv 2510.04618) | Contexts as evolving playbooks of itemized bullets with helpful/harmful counters; incremental delta updates; names the two failure modes **brevity bias** and **context collapse** (iterative full rewrites erode detail). | Index lines as self-sufficient imperative rules; never whole-file rewrites (this runtime learned that the hard way — shrink guard, diff guard). reads/helpful counters per note (BL-DRM-020). |
| **Trace2Skill** (arXiv 2603.25158) | Consolidating many traces into ONE skill/SoP beats episodic retrieval memories; skills transfer across model scales and families. | The escalation ladder's note→skill/gate doctrine: a rule that keeps failing as a note becomes a mechanism, and mechanisms transfer across models where notes do not. |
| **ReMe** (ACL 2026 findings) | Memory lifecycle = multi-faceted distillation + context-adaptive reuse + **utility-based refinement** (add validated, prune outdated). | The efficacy loop (RESOLVED/DORMANT/PERSISTING + cure-vs-treatment) is this; the missing third leg everywhere is delivery/reuse measurement — BL-DRM-020. |
| **"Language Models Need Sleep"** (arXiv 2606.03979) / **SCM** (arXiv 2604.20943) | Wake/sleep lifecycle framing; NREM (strengthen) vs REM (novel association) phases; importance-tagged forgetting. | Confirms the offline-cycle architecture; the forgetting-pressure idea supports bounded retention + expiry proposals rather than unbounded note growth. |
| **EvolveR / FlowEvo / SAGE / MSCE** (2025–26) | Closed-loop experience lifecycles; skills as executable artifacts with admission checks and negative-transfer curation. | Curation matters as much as acquisition: track whether an accepted note/skill helps, and suppress ones that cause harm — the council + efficacy + canary triad. |

## Receipts from the Python runtime (same architecture, live since 2026-08-07)

- **Consumption is the bottleneck, not production.** Applied notes scored
  PERSISTING with `reads_post = 0` — written, indexed, never opened. A
  delivery failure is invisible without retrieval telemetry; one afternoon of
  it separated "note never read" (0x) from "note read 23x and still failing"
  (a genuine content/mechanization case).
- **Reviewer councils degenerate silently.** One seat drifted to 12% accept,
  another to 95% over 19 votes; majority voting was theater. Accept-rate
  drift stats flagged it but could not distinguish strict-but-right from
  reflexively-wrong; a seeded known-bad canary proposal can.
- **Lifecycle dedup is load-bearing.** An escalation denied by review was
  re-minted nightly from unchanged efficacy evidence; its archive move then
  collided with its own denied copy and aborted the triage pass. Suppress
  re-mints across the whole lifecycle and make archive moves overwrite.
- **Multi-CLI unification pays immediately.** Merging OpenCode sessions into
  the same digest corpus made every efficacy verdict model-conditional for
  free (deepseek sessions show RESOLVED on failure classes that are
  Claude-only), and retired a duplicated engine that was drifting behind by
  whole subsystems.

## Follow-up receipt (2026-08-15, first unified cycle)

The delivery doctrine produced its first proposal within a day: with the linked
note scoring `reads_post = 0`, the dreamer stopped rewording it and instead
proposed moving the rule INTO the always-loaded index as a standing rule ("the
rule IS the line — no linked file"). The council accepted it 2/3 — and the
apply stage then refused it, because a guard requiring frontmatter of every
memory target treats an index as a note. Two lessons worth carrying into any
implementation:

- A validator written for the common artifact shape will eventually block the
  rarer one. Give indexes their own shape check (BL-DRM-024).
- Adding a doctrine changes which writes the system attempts, so it exercises
  guard paths that were previously unreachable. Budget for one round of
  false refusals after any change to what the consolidator is told to produce.

The seeded canary (BL-DRM-021) also had its first live run: all three seats
rejected the known-bad item, so no votes were discarded. That is a passing
calibration check, not proof the seats are healthy — the same run still logged
one seat at 13% accept and another at 96%.

## Port status in this toolkit (2026-08-15)

| Item | Status here |
|---|---|
| BL-DRM-020 read telemetry | **Landed.** `noteMemoryRead` in the digest layer, `reads_post` + `recommend_deliver` in `efficacy`, an `undelivered` item in `report`. |
| BL-DRM-021 review canary | **Not applicable.** No automated reviewer exists to calibrate — acceptance is HITL and the optional triage adapter already fails open to the human. |
| BL-DRM-022 consolidation tier | Open. |
| BL-DRM-023 escalation dedup | Open. |
| BL-DRM-024 index vs note validators | **Not reproducible.** The index is regenerated from the note tree, not written by a proposal, and no frontmatter-required validator exists. The delivery remedy is therefore the note's `description` (which becomes the index hook), not an index write. |

Worth noting for anyone porting between the two: the same doctrine produced
*different mechanics* in each codebase because the index is authored in one and
derived in the other. Copying the Python fix verbatim would have added a guard
for a write path that cannot happen here.

## Doctrine distilled

1. One engine, one corpus, one review, one apply; per-CLI code is adapters
   emitting a shared digest schema.
2. Memory has three legs: acquisition (dream), verification (efficacy), and
   **delivery** (retrieval telemetry + escalation into always-loaded surfaces
   or mechanisms). Any leg missing, the loop silently stops learning.
3. Append-only memory rots; consolidation must be able to merge, supersede,
   and expire — but only through the same gated proposal path as writes.
4. Every automated judge needs a calibration instrument with known ground
   truth (canaries), not just distribution statistics.
