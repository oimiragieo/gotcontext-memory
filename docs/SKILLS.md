# Skills registry — gotcontext-memory

Machine-oriented index. Lessons **L1–L24**: [`LESSONS_2026-08-09.md`](./LESSONS_2026-08-09.md).  
Entrypoints: [`../AGENTS.md`](../AGENTS.md), [`../CLAUDE.md`](../CLAUDE.md).  
Junior rebuild: [`guides/rebuild-from-scratch.md`](./guides/rebuild-from-scratch.md).

## Registry

| Skill | Path | When to load | Lessons |
|---|---|---|---|
| `gotcontext-memory-hitl-honesty` | [`.claude/skills/…/hitl-honesty`](../.claude/skills/gotcontext-memory-hitl-honesty/SKILL.md) | Dream / store / review / MCP / doctor; omega parity claims | L1–L14, L5, L10 |
| `gotcontext-memory-streaming-digests` | [`.claude/skills/…/streaming-digests`](../.claude/skills/gotcontext-memory-streaming-digests/SKILL.md) | Multi-GB corpora, digests, stratified window, concurrency, `.vscdb` | L15, L18, L22 |
| `gotcontext-memory-claim-lifecycle` | [`.claude/skills/…/claim-lifecycle`](../.claude/skills/gotcontext-memory-claim-lifecycle/SKILL.md) | Rejected=`claimKey`; accepted=path presence; prevalence; FPs | L16, L17, L7, L11 |

Efficacy has a **feature doc** ([features/efficacy.md](./features/efficacy.md)) rather than a fourth skill — load streaming-digests + claim-lifecycle + honesty when changing it.

## Contract pointers

- `mcp.allowCommit` default **false**  
- Streaming digests; stratified `--max-sessions` (400); `.vscdb` **on** path (BL-DRM-016 closed)  
- Rejected `claimKey` + accepted path presence  
- Efficacy: &lt;5 post-accept sessions → `INSUFFICIENT_DATA`; PERSISTING exits non-zero  
- Prefer `tg` · verify `npm test && npm run lint && npm run build`  
- Dirty-tree: stage only your paths (L19–L20)  
- Research: Exa or **labeled** WebSearch (L13)
