# Gotcontext Memory

Multi-harness **disk-canonical markdown memory** + out-of-band **HITL dreaming**.

New here? Start with the docs hub — especially if you are learning the system:

**→ [docs/README.md](docs/README.md)** (documentation map)  
**→ [docs/START-HERE.md](docs/START-HERE.md)** (plain-language orientation)  
**→ [docs/guides/quickstart.md](docs/guides/quickstart.md)** (install → init → dream)

---

## Install

```bash
cd gotcontext-memory
npm install
npm run build
npm link   # exposes `gotcontext-memory` (and optional `gcm` alias)
```

Prefer the `gotcontext-memory` binary. The `gcm` alias can collide with **Git Credential Manager** on Windows.

```bash
gotcontext-memory init          # ~/.gotcontext
gotcontext-memory init --project
gotcontext-memory dream --source claude --store user --force
gotcontext-memory review list
gotcontext-memory review show <id>
gotcontext-memory review accept <id> --yes
gotcontext-memory doctor
gotcontext-memory export --out /abs/path/out.gcm.gz
gotcontext-memory mcp   # thin JSON-RPC memory tools (additive; not full MCP SDK)
```

Full CLI: [docs/reference/cli.md](docs/reference/cli.md).

Docker dogfood (Windows PowerShell + Docker Desktop) for **claude / codex / cursor / agy / opencode**:

```powershell
pwsh -File scripts/docker-verify.ps1              # full matrix
pwsh -File scripts/docker-verify.ps1 -Harness codex
# or: npm run verify:docker
```

Details: [docs/guides/docker-verification.md](docs/guides/docker-verification.md).

---

## Documentation ecosystem

| Path | Contents |
|---|---|
| [docs/README.md](docs/README.md) | Hub + reading paths by role |
| [docs/START-HERE.md](docs/START-HERE.md) | Product orientation for juniors |
| [docs/glossary.md](docs/glossary.md) | Vocabulary |
| [docs/concepts/](docs/concepts/) | Mental model, layout, CAS, HITL |
| [docs/architecture/](docs/architecture/) | Overview, module map, data flow, security |
| [docs/features/](docs/features/) | Deep dives: store, dream, review, corpus, … |
| [docs/guides/](docs/guides/) | Quickstart, walkthrough, troubleshooting, tests |
| [docs/reference/](docs/reference/) | CLI, config, proposals, errors |
| [docs/adapters/](docs/adapters/) | Harness matrix + transcript formats |
| [docs/HONESTY.md](docs/HONESTY.md) | Claim boundaries (read before demos) |

Design history (plan / audits): [docs/superpowers/](docs/superpowers/).

---

## Adapter matrix (honest)

| Harness | Fragment install | Corpus |
|---|---|---|
| Claude Code | yes | full (incl. skill events when present) |
| Codex | yes | full turns (tool/skill metadata often empty) |
| Cursor | yes | full turns via JSONL + read-only sqlite (tool/skill partial) |
| agy | yes | PARTIAL |
| OpenCode | yes | PARTIAL |

Details: [docs/adapters/harness-matrix.md](docs/adapters/harness-matrix.md).

---

## Honesty

See [docs/HONESTY.md](docs/HONESTY.md). Claims **transcript → proposal → human accept** only.
Does **not** claim omega `memory_dream` auto-supersede. Package version is **0.9.0** pending CEO `1.0.0` gate.

---

## Architecture (short)

- Sole store-root writes: `MemoryStore` (`commitCanonical` / `commitOperational` / `deleteCanonical`). Installer may write **external** harness instruction files only; store-root manifests go through `commitOperational`.
- Caps: MEMORY.md ~200 lines / 25KB; CAS via sha256 `baseHash`
- MCP: additive thin JSON-RPC server (`gotcontext-memory mcp`); not `@modelcontextprotocol/sdk` parity

Deep dives: [docs/architecture/overview.md](docs/architecture/overview.md) · [docs/features/memory-store.md](docs/features/memory-store.md).
