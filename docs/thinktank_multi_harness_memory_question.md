# Thinktank: gotcontext-memory — multi-harness memory + dreaming package

## Mandate
You are a design council seat. Decide the architecture for packaging a shareable
**memory + dreaming** system into `C:\dev\projects\gotcontext-memory` so another
person can install it and get the same behavior across **Claude Code, Antigravity
(agy), Codex, OpenCode, and Cursor**.

Do **not** dispatch other agents, skills, or tools that edit files. Answer from
the required reading + the facts below. End with exactly one line:
`RECOMMENDED: <one-line verdict>`

## Goal (user-locked)
- Turn empty `gotcontext-memory/` into a codebase others can deploy.
- Target harnesses: Claude Code, agy, Codex, OpenCode, Cursor.
- Behavior target: memory + out-of-band **dreaming** (HITL accept/reject), not a
  toy sticky-note file.
- Reference research already done: `C:\dev\projects\_dream_audit\` (Anthropic
  DevCon talk → Hydron-oriented plan + fable audit).
- Live reference implementation in this workspace (NOT Claude-native): omega
  orchestrator `memory_dream` (facts auto-supersede, DEFAULT-OFF) +
  `transcript_dream` (HITL proposals, DEFAULT-OFF) + JARVIS `/dreaming` UX.
  Skill pointer: `transcript-dream-hitl`.

## Hard facts (verified this session — treat as ground truth)
1. `gotcontext-memory/` is **empty** (no code to "extract"; we must design+build).
2. WSL `~/.claude` has skills/workflows but **no settings.json**; project memory
   dirs are essentially empty — Claude-native memdir/autoDream is **not** what is
   currently "fully configured" on this machine.
3. `_dream_audit/plan.md` is Hydron/local-first: markdown memdir + CAS hash writes
   + permission tiers + out-of-band dream mission + human review. Fable audit
   APPROVE-WITH-EDITS: add steering, skill-invocation corpus, staleness/delete,
   portability export, index caps, secret scanner, default-OFF auto-dream, etc.
4. Omega stack is SQLite facts + orch daemon scheduler — heavy, JARVIS-coupled,
   **not** a drop-in for Codex/Cursor/OpenCode/agy alone.
5. User rejected single-harness options; wants one install for all five tools.

## Open architectural fork (you must pick)
**Where does the shared brain live?**
- **A.** Always-on local daemon + memory plane; each harness is a thin adapter.
- **B.** Portable on-disk memory tree + dream CLI only (no daemon); each harness
  mounts via native config (CLAUDE.md / AGENTS.md / rules / hooks).
- **C.** Hybrid: disk as source of truth + **optional** daemon for auto-dream /
  HITL inbox ("set and forget").

## Additional forks you must resolve in the same verdict
1. **v1 honesty scope:** What is the smallest ship that still legitimately claims
   "dreams" (HITL proposals from multi-session transcripts + tool metadata) vs
   what must be labelled "in-band stub / consolidation" per `_dream_audit` honesty?
2. **Store format:** markdown tree (talk + `_dream_audit`) vs SQLite (omega) vs
   both with one canonical write API.
3. **Adapter strategy:** one shared MCP server vs per-harness hooks/plugins vs
   both (MCP for tools that speak MCP; file mounts for the rest).
4. **Permission / CAS:** Must v1 ship content-hash CAS + revision sidecars, or is
   that phase-2 while v1 ships propose-only dream + simple atomic writes?
5. **What NOT to port:** Call out omega coupling that would poison a shareable
   package (Telegram, voice speaker-gate, OMEGA_FACTS_DB path assumptions, etc.).
6. **Install UX:** single installer script that detects harnesses and writes the
   right config fragments — yes/no; if yes, which language (bash/PowerShell/node)?

## Required reading (cite paths in evidence; if you cannot read a path, say
`CANNOT_READ_REQUIRED_FILE: <path>` and still answer from the facts section)
- `C:\dev\projects\_dream_audit\plan.md`
- `C:\dev\projects\_dream_audit\research.md`
- `C:\dev\projects\_dream_audit\fable-audit.md` (sections A–F / CE-10+)
- `C:\dev\projects\omega-jarvis\docs\superpowers\specs\2026-08-07-context-engineering-dreaming-design.md`
- Skill contract (HITL vs auto): `C:\Users\james\.claude\skills\transcript-dream-hitl\SKILL.md`
  (WSL: `/home/james/.claude/skills/transcript-dream-hitl/SKILL.md`)

## Verification clause
- Prefer designs that another engineer can install on a clean machine with only
  the repo + documented deps — no omega-jarvis/orchestrator required for v1.
- Reject any design that auto-applies transcript-derived memory without HITL
  (DEFAULT-OFF is not enough if the happy path is silent write).
- Reject "Managed Agents API clone" as the product (talk product cliff).
- Every claim about "parity with the CEO's live system" must name which loop
  (memory_dream auto facts vs transcript_dream HITL) is being claimed.

## Noise-calibration (for any quantitative claim, e.g. token savings)
If you assert ROI / savings: (1) measurement surface, (2) no-op control,
(3) SNR≥3× or defend lower, (4) kill condition. Else label qualitative only.

## Output format (mandatory sections)
1. **Pick A/B/C** with 3–5 sentences of why losers lose for a *shareable* package.
2. **v1 package shape** — directories/files a junior would create; installer surface.
3. **Per-harness adapter table** — Claude / agy / Codex / OpenCode / Cursor:
   what gets installed, how memory is read, how dream is triggered.
4. **Must-ship contracts** — CAS? HITL? default-OFF? secret scan? index caps?
   List CE-* / talk primitives that are **blocking for v1**.
5. **Explicit non-goals for v1**.
6. **Phased roadmap** — v1 / v1.1 / v2 (one line each).
7. **Risks** — top 3 ways this package would lie to adopters.
8. Final line: `RECOMMENDED: <A|B|C> — <≤20 word summary>`
