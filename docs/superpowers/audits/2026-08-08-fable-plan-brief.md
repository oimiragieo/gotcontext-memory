# Fable brief: write the gotcontext-memory implementation plan

You are Claude Fable writing an implementation plan for a junior engineer.
Answer inline. Do not dispatch other agents. Do not edit files yourself — emit
the FULL plan markdown in your reply (the orchestrator will save it).

## Locked architecture (do not reopen A/B/C)

**C — Hybrid:** disk-canonical markdown memory at `~/.gotcontext/` (user) and/or
`<project>/.gotcontext/` (project). Optional daemon is **v1.1+** and may only
queue proposals — never a second write path.

**Sole write API:** `MemoryStore.commit()` with sha256 CAS, tempfile→rename,
revision sidecars, secret scan, MEMORY.md caps (~200 lines / 25KB).

**Dreaming honesty:** v1 claims only the **HITL transcript dream** loop
(proposals → human accept/reject). Do NOT claim omega `memory_dream`
auto-supersede parity. No Telegram, voice, speaker-gate, OMEGA_FACTS_DB.

**Targets:** Claude Code, Antigravity (agy), Codex, OpenCode, Cursor.
Installer: Node `npx gotcontext-memory init` with --dry-run / --uninstall / doctor.
Adapters = managed instruction fragments for all five + optional shared MCP.
Corpus importers: ship Claude + Codex + Cursor in v1; agy/OpenCode adapters
ship but may label corpus partial until dogfood receipts.

## Required reading (cite in plan where relevant)
- C:\dev\projects\_dream_audit\plan.md
- C:\dev\projects\_dream_audit\fable-audit.md (CE-10..15, honesty flags)
- C:\dev\projects\_dream_audit\research.md
- C:\dev\projects\omega-jarvis\docs\superpowers\specs\2026-08-07-context-engineering-dreaming-design.md
- C:\dev\projects\gotcontext-memory\docs\thinktank_council_20260808_155453\CHAIRMAN_SYNTHESIS.md
- C:\dev\projects\gotcontext-memory\docs\thinktank_multi_harness_memory_question.md

WSL equivalents under /mnt/c/dev/projects/... and
/home/james/.claude/skills/transcript-dream-hitl/SKILL.md for HITL contract.

## Plan format (MANDATORY — writing-plans skill)

Start with this header:

```
# Gotcontext Memory Multi-Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ...
**Architecture:** ...
**Tech Stack:** Node/TypeScript preferred (one cross-platform CLI)...

## Global Constraints
...
```

Then:
1. **File map** — every path created and its one responsibility.
2. **Serial tasks** (cap ~12) — each with: Goal, Files, Red-arm test name FIRST,
   numbered steps (write failing test → run fail → implement → run pass),
   Done when (oracle), Do NOT.
3. **TDD:** every load-bearing task has a bidirectional red arm (control fails
   without the gate; treatment passes).
4. Fold scaffolding/docs into the task that needs them — no empty “setup only” tasks.
5. Include: store+CAS, secrets, index caps, corpus builders, dream run (zero writes),
   review HITL, installer+5 adapters, doctor, export/import, dream-policy steering.
6. Explicit non-goals section.
7. Final line: `PLAN_STATUS: READY_FOR_AUDIT`

## Constraints the plan must encode
- Fresh install never dreams unprompted (default-OFF).
- Dream run leaves memory tree byte-hash identical.
- Reject leaves store byte-identical; accept uses proposal base_hash CAS.
- Empty corpus refuses with explicit zero label (proves nothing).
- No omega dependencies in package.json or runtime.
- Windows + macOS + Linux from Node (no bash-only installer).
