# Feature: MemoryStore

**Code:** `src/store.ts` (~400 LOC)  
**Tests:** `test/store.test.ts`, `test/store-extra.test.ts`  
**Concepts:** [CAS](../concepts/cas-and-hashing.md) · [layout](../concepts/store-layout.md) · [canonical vs operational](../concepts/canonical-vs-operational.md)

---

## Purpose

`MemoryStore` is the **only** supported API for mutating product data inside a
gotcontext store root. CLI, dream, review, doctor, portability, and MCP all go
through it (directly or via helpers that call it).

---

## Construction

```ts
const store = new MemoryStore(root);
await store.reloadConfig(); // loads secrets.allowlist from config.json
```

Or bootstrap empty structure:

```ts
await MemoryStore.initStore(root);
```

`initStore` creates directories, empty `MEMORY.md`, and default `config.json`.

---

## Public methods (analyst view)

| Method | Kind | What it does |
|---|---|---|
| `commitCanonical({ relativePath, body, baseHash, provenance })` | canonical | CAS write with scan/caps/locks/revisions/journal |
| `deleteCanonical({ relativePath, baseHash, provenance })` | canonical | CAS delete with revision tombstone metadata |
| `commitOperational({ relativePath, body, scanSecrets? })` | operational | Contained write; scan on unless `scanSecrets: false` |
| `removeOperational(relativePath)` | operational | Unlink under containment |
| `read(relativePath)` | read | `Buffer \| null` |
| `currentHash(relativePath)` | read | sha256 or `"absent"` |
| `memoryTreeHash()` | read | Canonical-only tree hash |
| `withCanonicalLocks(paths, fn)` | lock | Sorted multi-path lock session |
| `history(relativePath)` | read | Revision list + meta |
| `rollback(path, hashPrefix, provenance)` | canonical | Re-commit old revision bytes as new tip |
| `getSecretAllowlist()` | read | Copy of config allowlist |

`LockedStore` exposes `commitCanonicalLocked` / `deleteCanonicalLocked` for
callers already holding locks (review accept).

---

## Error types

| Class | When |
|---|---|
| `CasConflict` | `baseHash` mismatch; `.currentHash` is actual |
| `IndexCapExceeded` | MEMORY.md over line/byte cap |
| `SecretDetected` | Pattern hit (from `secrets.ts`) |
| `Error` (containment / canonical path) | Bad relative path |

---

## Provenance

Every canonical commit carries:

```ts
{
  authored_by: "dream" | "agent" | "human" | "system",
  source?: string,
  transcript_id?: string | null,
  proposal_id?: string,
}
```

Stored on revision `.meta.json` and journal lines, along with the active allowlist.

---

## Junior debugging tips

1. **CasConflict after hand-edit** — recompute hash of on-disk file; use that as `baseHash`.
2. **Dream claims it mutated tree hash** — something wrote under `memory/` or `MEMORY.md` outside `commitOperational`.
3. **Lock stuck** — check `locks/` stubs and whether another process holds `proper-lockfile`.

← [Hub](../README.md) · Next → [secrets.md](./secrets.md)
