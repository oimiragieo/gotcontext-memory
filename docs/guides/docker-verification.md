# Docker verification (Claude Code CLI)

**Host:** Windows PowerShell + Docker Desktop (not the WSL `docker` socket).  
**Entry:** `pwsh -File scripts/docker-verify.ps1` or `npm run verify:docker`

---

## What it proves

The image installs **Claude Code CLI** (`claude`) and **gotcontext-memory**, then runs
`docker/verify.sh` which asserts the designed CUJs:

1. Binaries on `PATH` (`claude`, `gotcontext-memory`)
2. `init` creates `~/.gotcontext` + harness fragments (incl. `~/.claude/CLAUDE.md`)
3. `doctor` OK on empty store
4. Seed Claude JSONL under `~/.claude/projects` → `dream` → `review accept`
5. Project store + ambiguous-store refusal
6. `export` / `import --merge`
7. Thin MCP JSON-RPC smoke
8. `uninstall` strips managed markers
9. In-image `npm test` + `npm run lint`

Report artifact: `docker/out/VERIFY_REPORT.md` (bind-mounted).

---

## Issues found in dogfood

| ID | Symptom | Fix |
|---|---|---|
| DV-001 | `npm link` / global bin: `import: not found` — `dist/cli.js` executed as shell | Add `#!/usr/bin/env node` shebang to `src/cli.ts` (preserved by `tsc`) |

Further rows are appended as verification finds them.

---

## Notes

- Claude Code is installed via `npm install -g @anthropic-ai/claude-code` (ships native linux binary). No Anthropic API key is required for this harness — we only need the CLI present and a realistic `~/.claude` layout.
- Rebuild after local source changes: `pwsh -File scripts/docker-verify.ps1` (image `COPY`s sources at build time).
