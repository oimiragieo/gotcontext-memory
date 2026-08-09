# Feature: MCP-like server

**Code:** `src/mcp/server.ts`, `src/mcp/handlers.ts`  
**Tests:** `test/mcp.test.ts`  
**Honesty:** Not `@modelcontextprotocol/sdk` parity — thin JSON-RPC over stdio.

---

## Purpose

Let harnesses that speak MCP-style tool calls read/search/propose
**without** bypassing `MemoryStore` gates. Direct `memory_commit` is **opt-in**
(`mcp.allowCommit: true`) and is a conscious non-HITL mode.

---

## CLI

```bash
gotcontext-memory mcp --store user
# speaks JSON-RPC lines on stdin/stdout until EOF
```

`init --mcp` only prints guidance to run this command; it does **not** auto-register
into each harness’s MCP config in v0.9.

---

## Tools

| Tool | Writes? | Behavior |
|---|---|---|
| `memory_search` | No | List `memory/**` paths |
| `memory_read` | No | Read `MEMORY.md` or `memory/**` only |
| `memory_propose` | Operational | Write a HITL proposal JSON |
| `memory_commit` | Yes (opt-in) | Listed/callable only when `mcp.allowCommit` is true |

Default config: `mcp.allowCommit: false` — `tools/list` omits commit; `tools/call`
returns an error pointing operators at `memory_propose` + `review accept`.

Stale `baseHash` → JSON-RPC error payload containing `CasConflict`.
Planted secrets → rejected; tree hash unchanged.

---

## Protocol surface

Handled methods: `initialize`, `tools/list`, `tools/call`.
This is enough for simple integrations and tests; it is **not** a claim of full
MCP lifecycle/compliance.

Handlers are exported separately so unit tests do not need a real stdio child.

← [portability](./portability.md) · Next → [CLI reference](../reference/cli.md)
