# Feature: MCP-like server

**Code:** `src/mcp/server.ts`, `src/mcp/handlers.ts`  
**Tests:** `test/mcp.test.ts`  
**Honesty:** Not `@modelcontextprotocol/sdk` parity — thin JSON-RPC over stdio.

---

## Purpose

Let harnesses that speak MCP-style tool calls read/search/commit/propose
**without** bypassing `MemoryStore` gates.

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
| `memory_read` | No | Read file text |
| `memory_commit` | Yes | `commitCanonical` with CAS |
| `memory_propose` | Operational | Write a HITL proposal JSON |

Stale `baseHash` → JSON-RPC error payload containing `CasConflict`.
Planted secrets → rejected; tree hash unchanged.

---

## Protocol surface

Handled methods: `initialize`, `tools/list`, `tools/call`.
This is enough for simple integrations and tests; it is **not** a claim of full
MCP lifecycle/compliance.

Handlers are exported separately so unit tests do not need a real stdio child.

← [portability](./portability.md) · Next → [CLI reference](../reference/cli.md)
