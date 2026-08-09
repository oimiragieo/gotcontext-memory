# Gotcontext Memory — Multi-Harness Design

**Status:** Architecture C locked. Implementation plan **APPROVED** (Thinktank R4, 2026-08-08).  
**Date:** 2026-08-08

## Goal

A shareable Node package (`gotcontext-memory`) that another person can install so **Claude Code, Antigravity (agy), Codex, OpenCode, and Cursor** share one memory plane and an out-of-band **HITL dreaming** loop — without requiring omega-jarvis/orchestrator.

## Architecture (locked: C)

- **Canonical store:** markdown + YAML frontmatter under `~/.gotcontext/` (user) and/or `<project>/.gotcontext/` (project).
- **Sole write path:** `MemoryStore.commit()` — sha256 CAS, atomic rename, revision sidecars, secret scan, MEMORY.md caps.
- **Dreaming:** corpus → `gcm dream` (proposals only) → `gcm review` (accept/reject/expire). Optional daemon is v1.1+ and may only *queue* proposals.
- **Adapters:** managed instruction fragments for all five harnesses + optional shared MCP.
- **Honesty:** claim parity with omega `transcript_dream` HITL only — never `memory_dream` auto-supersede.

## Non-goals (v1)

Managed Agents API clone; omega dependencies; Telegram/voice/speaker-gate; SQLite as second writable truth; silent transcript→memory apply.

## Authority

- Council: `docs/thinktank_council_20260808_155453/CHAIRMAN_SYNTHESIS.md`
- Research: `C:\dev\projects\_dream_audit\`
- HITL contract: `transcript-dream-hitl` skill
