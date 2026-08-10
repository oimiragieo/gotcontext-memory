# Workflows — gotcontext-memory

Agent workflows that span docs, skills, and code. Not a substitute for
[`AGENTS.md`](../AGENTS.md) or [`SKILLS.md`](./SKILLS.md).

## Multi-lane doc / skill evolution

When several agents (or lanes) evolve docs and skills in parallel:

1. **Enumerate live work** — do not bake a fixed PR/file list at dispatch; re-list open lanes each pass.
2. **One writer per path set** — partition by file ownership; merge arbiter runs `npm test && npm run lint && npm run build` on the **merged** tree.
3. **Stage only your paths** (L20) — `git add <only-my-paths>`; compare cached vs unstaged name lists before commit.
4. **Update the registry** — any new skill lands under `.claude/skills/<name>/` **and** a row in [`SKILLS.md`](./SKILLS.md); point `AGENTS.md` / `.claude/MEMORY.md` if load-bearing.
5. **Lessons stick in one place** — append durable rules to [`LESSONS_2026-08-09.md`](./LESSONS_2026-08-09.md) (or a dated successor); one-liners can mirror into `.claude/MEMORY.md`.
6. **Honesty before demos** — claim-boundary changes go in [`HONESTY.md`](./HONESTY.md) the same turn (e.g. BL-DRM-016).

### Dynamic workflows skill

The workspace skill **`authoring-dynamic-workflows`** is the usual fan-out authoring path for large multi-source jobs. **It is missing on disk on this host** — do not block lane work waiting for it; use explicit parallel agents + this doc, and note the gap if a plan assumes the skill.

## Which skills to load

| Work surface | Load |
|---|---|
| Dream / preference extraction / proposal staging | `gotcontext-memory-hitl-honesty` + `gotcontext-memory-streaming-digests` + `gotcontext-memory-claim-lifecycle` |
| MemoryStore / CAS / locks / `MEMORY.md` regen | `gotcontext-memory-hitl-honesty` |
| MCP tools (`memory_read` / propose / commit) | `gotcontext-memory-hitl-honesty` (L5 `allowCommit`) |
| Compare to omega/JARVIS dream | `transcript-dream-hitl` (sibling) + hitl-honesty |
| Doc/skill registry only | [`SKILLS.md`](./SKILLS.md) — no deep skill body required |

## Hot contract reminder

Digests · `claimKey` · `--max-sessions` · `mcp.allowCommit` · **BL-DRM-016** · prefer `tg` · Exa or labeled WebSearch (L13).
