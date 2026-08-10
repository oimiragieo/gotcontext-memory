# Skills registry — gotcontext-memory

Machine-oriented index of agent skills for this repo. Prefer loading the skill
body before editing the matching subsystem. Lessons **L1–L21** live in
[`LESSONS_2026-08-09.md`](./LESSONS_2026-08-09.md); entrypoints in
[`../AGENTS.md`](../AGENTS.md) and [`../CLAUDE.md`](../CLAUDE.md).

## Registry

| Skill | Path | When to load | Lessons |
|---|---|---|---|
| `gotcontext-memory-hitl-honesty` | [`.claude/skills/gotcontext-memory-hitl-honesty/`](../.claude/skills/gotcontext-memory-hitl-honesty/SKILL.md) — also mirrored to `~/.claude/skills/` | Dream / store / review / MCP / doctor; any claim vs omega `memory_dream` / `transcript_dream` | L1–L14, L5, L10 |
| `gotcontext-memory-streaming-digests` | [`.claude/skills/gotcontext-memory-streaming-digests/`](../.claude/skills/gotcontext-memory-streaming-digests/SKILL.md) | Corpus importers, multi-GB transcripts, OOM, truncated vs malformed, digest dream path | L15, L18 |
| `gotcontext-memory-claim-lifecycle` | [`.claude/skills/gotcontext-memory-claim-lifecycle/`](../.claude/skills/gotcontext-memory-claim-lifecycle/SKILL.md) | Rejected=`claimKey`; accepted prefs=path presence; prevalence / `--max-sessions`; evidence sort | L16, L17, L7, L11 |
## Referenced-but-absent (verified 2026-08-09)

A skill name in a doc is a promise the loader will resolve. Both rows below were stated as
if present and were checked against disk:

| Skill | Verified status | Action |
|---|---|---|
| `transcript-dream-hitl` | **DOES NOT EXIST** — absent from `~/.claude/skills/` and from this repo (`find ~/.claude/skills -name transcript-dream-hitl` → no match) | Aspirational sibling only. Do **not** instruct an agent to load it. Either write it or drop the reference; until then it is named here as absent, not as a sibling. |
| `authoring-dynamic-workflows` | **EXISTS** at `~/.claude/skills/authoring-dynamic-workflows/` — loaded successfully 2026-08-09 | The prior "Missing on disk this host" row was **wrong**. Corrected. |

Lesson: an unverified "missing"/"present" claim in a registry is worse than no row — it either
sends an agent hunting for something absent, or stops it loading something it has.

## Contract pointers (all skills)

- `mcp.allowCommit` default **false** — conscious non-HITL only when true  
- Streaming digests; rejected `claimKey` + accepted path presence; `--max-sessions` (default 400)  
- After method jumps, run the retention lanes in [`WORKFLOWS.md`](./WORKFLOWS.md) (L21)  
- Cursor `.vscdb` gap tracked as **BL-DRM-016** (pre-1.0 must-fix)  
- Prefer `tg` for symbol/impact · verify with `npm test && npm run lint && npm run build`  
- Dirty-tree: stage only your paths; never commit `.tensor-grep/` (L19–L20)  
- Research freshness: Exa or **labeled** WebSearch (L13)
