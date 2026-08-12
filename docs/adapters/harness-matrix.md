# Harness matrix

**Related:** [installer](../features/installer-adapters.md) · [corpus](../features/corpus-importers.md) · [HONESTY](../HONESTY.md) · [transcript formats](./transcript-formats.md)

---

## Summary

| Harness | Adapter fragment | Corpus importer | Notes |
|---|---|---|---|
| Claude Code | `~/.claude/CLAUDE.md` | Full JSONL + Skill events | Dream roots: `~/.claude/projects` (`src/corpus/roots.ts`) |
| Codex | `~/.codex/AGENTS.md` | Full turns — real rollout shape (`response_item`/`payload.message`) since 2026-08-12; developer/system turns excluded | Dream roots: `~/.codex/sessions` (nested date dirs) + `projects` |
| Cursor | `.cursor/rules/gotcontext-memory.mdc` | JSONL + read-only sqlite `.vscdb` | Dream roots: `~/.cursor/projects` + `<cwd>/.cursor` |
| Antigravity (`agy`) | `<cwd>/AGENTS.md` | PARTIAL enumerate | Dream roots: `~/.agy/sessions` + `~/.antigravitycli` |
| OpenCode | `<cwd>/AGENTS.md` | **SQLite store on the digest path** since 2026-08-12 (`digestOpencodeDb`: read-only, newest-N by session clock, shared classifier) | Db: `$XDG_DATA_HOME/opencode/opencode.db` (else `~/.local/share/...`); the JSONL roots (`~/.opencode/sessions` + `projects`) remain configured but have never existed in the wild; deduped with agy on install |

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
