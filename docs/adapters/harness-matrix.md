# Harness matrix

**Related:** [installer](../features/installer-adapters.md) · [corpus](../features/corpus-importers.md) · [HONESTY](../HONESTY.md) · [transcript formats](./transcript-formats.md)

---

## Summary

| Harness | Adapter fragment | Corpus importer | Notes |
|---|---|---|---|
| Claude Code | `~/.claude/CLAUDE.md` | Full JSONL + Skill events | Default dream roots: `~/.claude/projects` |
| Codex | `~/.codex/AGENTS.md` | Full turns JSONL | Tool/skill metadata often empty |
| Cursor | `.cursor/rules/gotcontext-memory.mdc` | JSONL + read-only sqlite `.vscdb` | Experimental `node:sqlite` |
| Antigravity (`agy`) | `<cwd>/AGENTS.md` | PARTIAL enumerate | Shared path with OpenCode |
| OpenCode | `<cwd>/AGENTS.md` | PARTIAL enumerate | Deduped with agy in one install run |

---

## Shared instruction constraints

All five fragments include (parity-tested) sentences about:

- Where durable memory lives (`MEMORY.md` + `memory/*`)
- Not silently rewriting memory
- Writes going through `gotcontext-memory` / MCP commit tools

---

## MCP registration

Not auto-wired per harness in v0.9. Operators run `gotcontext-memory mcp` and
register that command in the harness’s own MCP settings if desired.

← [transcript-formats](./transcript-formats.md) · [Hub](../README.md)
