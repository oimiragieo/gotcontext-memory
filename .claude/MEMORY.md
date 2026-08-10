# Memory index — gotcontext-memory

Cross-session pointer for agents in this repo.

- **CEO brief:** [docs/CEO_UPDATE_2026-08-09.md](../docs/CEO_UPDATE_2026-08-09.md)
- **Full backlog:** [docs/BACKLOG.md](../docs/BACKLOG.md)
- **Lessons L1–L24:** [docs/LESSONS_2026-08-09.md](../docs/LESSONS_2026-08-09.md)
- **Skill registry:** [docs/SKILLS.md](../docs/SKILLS.md)
- **Junior rebuild:** [docs/guides/rebuild-from-scratch.md](../docs/guides/rebuild-from-scratch.md)
- **Workflows:** [docs/WORKFLOWS.md](../docs/WORKFLOWS.md)
- **Honesty:** [docs/HONESTY.md](../docs/HONESTY.md)
- **Efficacy:** [docs/features/efficacy.md](../docs/features/efficacy.md)

## Skills

- `gotcontext-memory-hitl-honesty`
- `gotcontext-memory-streaming-digests`
- `gotcontext-memory-claim-lifecycle`

## Current product shape (0.9.0)

Streaming digests (JSONL + Cursor `.vscdb`) → stratified window → prefs + prevalence →
HITL accept → optional **efficacy** scoring. BL-DRM-016 closed. Main includes
`b9e5158` / `beda78e` era features.
