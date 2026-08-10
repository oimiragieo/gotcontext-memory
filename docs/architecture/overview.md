# Architecture overview

**Related:** [module map](./module-map.md) · [data flow](./data-flow.md) ·
[security model](./security-model.md) · [design spec](../superpowers/specs/2026-08-08-gotcontext-memory-multi-harness-design.md)

---

## Locked shape (Hybrid “C”)

From the design council:

1. **Disk-canonical markdown** under `~/.gotcontext/` and/or `<project>/.gotcontext/`
2. **Sole write API** for store-root product data: `MemoryStore`
3. **Optional MCP** is additive — dreaming works with files alone
4. **No daemon/scheduler in v1**
5. **No omega / Telegram / voice dependencies**

---

## Layering

```text
┌─────────────────────────────────────────────┐
│  CLI (src/cli.ts)  ·  MCP stdio (src/mcp/)  │  user-facing I/O
├─────────────────────────────────────────────┤
│  dream (digest+run) · review · doctor ·     │  use-cases
│  installer · portability · corpus · index   │
├─────────────────────────────────────────────┤
│  MemoryStore (src/store.ts)                 │  sole store writer
├─────────────────────────────────────────────┤
│  paths · hash · secrets · frontmatter ·     │  primitives
│  config                                     │
├─────────────────────────────────────────────┤
│  filesystem (store root + external adapters)│
└─────────────────────────────────────────────┘
```

**Dream path:** CLI streams transcripts into bounded digests (`src/dream/digest.ts`)
then extracts preference + windowed-prevalence proposals (`runDreamFromDigests`).
MCP `memory_commit` stays default-off (`mcp.allowCommit: false`).

**Rule of thumb:** use-case modules must not call `fs.writeFile` on the store.
They call `MemoryStore` methods. The AST guard in tests enforces this for `src/`.

---

## Runtime topology

There is no always-on process. Each CLI invocation:

1. Resolves store tier (`--store user|project` or default user)
2. Constructs `MemoryStore(root)` + `reloadConfig()`
3. Runs one command
4. Exits

`gcm mcp` is the exception: a long-lived stdio loop until stdin closes.

---

## Cross-cutting concerns

| Concern | Where enforced |
|---|---|
| Path containment | `src/paths.ts` on every store resolve |
| Secrets | `src/secrets.ts` in commit paths + dream/review preflight |
| Index size | `checkIndexCaps` on MEMORY.md commits + accept preflight |
| Concurrency | `proper-lockfile` + CAS |
| Honesty / labels | PARTIAL corpus stubs, docs/HONESTY.md, version 0.9.0 |

---

## What “passing the audit” meant

The Codex implementation audit (round 5) treated **core gates** as:

- CAS + sole-writer discipline
- Accept preflight / rollback
- Proposal id containment
- Valid CI matrix
- Honest docs for partial surfaces

Non-blocking gaps (merged project/user reads, full MCP SDK, etc.) may still
exist — see the [PASS report](../superpowers/audits/codex_impl_audit_20260808_171008/REPORT.md).

Next → [module-map.md](./module-map.md)
