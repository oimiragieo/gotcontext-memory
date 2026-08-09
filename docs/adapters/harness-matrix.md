# Harness matrix

**Related:** [installer](../features/installer-adapters.md) · [corpus](../features/corpus-importers.md) · [HONESTY](../HONESTY.md) · [transcript formats](./transcript-formats.md)

---

## Summary

| Harness | Adapter fragment | Corpus importer | Notes |
|---|---|---|---|
| Claude Code | `~/.claude/CLAUDE.md` | Full JSONL + Skill events | Dream roots: `~/.claude/projects` (`src/corpus/roots.ts`) |
| Codex | `~/.codex/AGENTS.md` | Full turns JSONL | Dream roots: `~/.codex/sessions` + `projects` |
| Cursor | `.cursor/rules/gotcontext-memory.mdc` | JSONL + read-only sqlite `.vscdb` | Dream roots: `~/.cursor/projects` + `<cwd>/.cursor` |
| Antigravity (`agy`) | `<cwd>/AGENTS.md` | PARTIAL enumerate | Dream roots: `~/.agy/sessions` + `~/.antigravitycli` |
| OpenCode | `<cwd>/AGENTS.md` | PARTIAL enumerate | Dream roots: `~/.opencode/sessions` + `projects`; deduped with agy on install |

Docker matrix: [docker-verification](../guides/docker-verification.md).

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
