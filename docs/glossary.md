# Glossary

**Related:** [START-HERE](./START-HERE.md) · [concepts/mental-model](./concepts/mental-model.md)

Terms appear here exactly as the codebase and docs use them.

| Term | Meaning |
|---|---|
| **Canonical memory** | Files that count as durable truth: `MEMORY.md` and everything under `memory/`. Changing them requires `commitCanonical` / `deleteCanonical`. |
| **Operational path** | Store files that are *not* canonical: proposals, receipts, revisions, config, installer manifest. Written via `commitOperational` (or installer for *external* harness files). |
| **CAS** | Compare-And-Swap. A commit supplies `baseHash`; if on-disk hash ≠ `baseHash`, the write is refused (`CasConflict`). |
| **`baseHash`** | Hex sha256 of current file bytes, or the sentinel string `absent` when the file must not exist yet. |
| **`BASE_ABSENT`** | Constant `"absent"` meaning “expect no file”. |
| **`memoryTreeHash`** | Single sha256 over the set of canonical files (`memory/**/*.md` + `MEMORY.md`). Ignores proposals/receipts/revisions. Used to prove dream/reject did not mutate memory. |
| **HITL** | Human-in-the-loop. Dream proposes; a human must accept/reject. |
| **Dream** | Pipeline: corpus scan → extract proposals → write `proposals/<id>.json`. Zero canonical writes. |
| **Proposal** | JSON document describing a intended memory change (`create` / `update` / `supersede` / `expire` / `delete`) with evidence quotes. |
| **Review** | CLI/API to list/show/accept/reject proposals. Accept is the only path from proposal → canonical. |
| **Corpus / importer** | Code that reads a harness’s on-disk session logs into normalized `Transcript` objects. |
| **Harness / adapter** | A coding agent product (Claude Code, Codex, …). Adapter = managed instruction fragment installer for that product. |
| **Managed block** | Text between `<!-- gotcontext-memory:begin -->` and `<!-- gotcontext-memory:end -->` written into harness instruction files. |
| **Store tier** | `user` (`~/.gotcontext`) or `project` (`<cwd>/.gotcontext`). Writes must name a tier when both exist. |
| **Secret scan** | Regex gate that rejects AWS keys, GitHub PATs, generic `sk-…` keys, and PEM private-key headers before canonical (and default operational) writes. |
| **Allowlist** | Named secret pattern names in `config.json` → `secrets.allowlist` that skip the scan. Recorded in revision provenance. |
| **Index / `MEMORY.md`** | Human-readable table of contents regenerated from memory files. Hard-capped (~200 lines / 25KB). |
| **Index cap** | `LINE_CAP=200`, `BYTE_CAP=25*1024`. Exceeding throws `IndexCapExceeded` — never auto-truncate. |
| **Revision sidecar** | Prior bytes + `.meta.json` under `revisions/` written when a canonical file is replaced or deleted. |
| **Receipt** | JSON under `receipts/` recording accept success or `INDEX_DRIFT_OR_CAS` errors (and import summaries). |
| **Preflight** | Checks (schema, expiry, secrets, index caps) run *before* any canonical mutation on accept. |
| **Sole writer** | Convention + AST guard: only `store.ts` (plus audited installer/portability carve-outs) may call fs mutation APIs under `src/`. |
| **MCP-like server** | Thin stdio JSON-RPC loop exposing `memory_read` / `memory_search` / `memory_commit` / `memory_propose`. Not full `@modelcontextprotocol/sdk`. |
| **PARTIAL corpus** | agy / OpenCode importers that enumerate candidate paths but do not yet parse sessions into transcripts. |

← [Hub](./README.md) · Next → [concepts/mental-model.md](./concepts/mental-model.md)
