# Canonical vs operational writes

**Code:** `MemoryStore.commitCanonical` / `commitOperational` / `deleteCanonical`  
**Related:** [CAS](./cas-and-hashing.md) · [security model](../architecture/security-model.md)

---

## The rule

| Kind | Paths | API | Gates |
|---|---|---|---|
| **Canonical** | `MEMORY.md`, `memory/**` | `commitCanonical`, `deleteCanonical` | CAS + secret scan + (index caps for MEMORY.md) + locks + revisions |
| **Operational** | everything else under the store | `commitOperational`, `removeOperational` | Path containment; secret scan **on by default** (can disable with `scanSecrets: false`) |

Calling `commitOperational` on a canonical path throws.
Calling `commitCanonical` on a non-canonical path fails the canonical-path check
(after containment).

---

## Why split them?

1. **`memoryTreeHash` proof** — dream/reject can write proposals freely and still
   prove they did not touch durable memory.
2. **Different risk** — a bad proposal JSON is annoying; a bad memory note is a
   permanent wrong “fact” for agents.
3. **Sole-writer discipline** — all store-root mutations still funnel through
   `MemoryStore` (installer may write *external* harness files only).

---

## Examples

| Action | API |
|---|---|
| Accept a create proposal | `commitCanonical` on target + `MEMORY.md` |
| Dream writes a proposal | `commitOperational` `proposals/<id>.json` |
| Reject moves proposal | `commitOperational` rejected copy + `removeOperational` pending |
| Init saves installer manifest | `commitOperational` `installer-manifest.json` |
| Import secret-bearing memory | `commitCanonical` → `SecretDetected` → rejected count++ |

---

## AST guard (engineering check)

`test/guards.test.ts` walks `src/**/*.ts` and fails if any module other than
`store.ts`, `installer.ts`, or `portability.ts` calls `writeFile` / `rename` /
`unlink` / `rm` / `createWriteStream`.

- **store.ts** — the sole store-root writer for product data
- **installer.ts** — external harness files (+ store mutations must still go
  through `MemoryStore` for manifests)
- **portability.ts** — gzip archive **outside** the store via `createWriteStream`

Runtime tests also prove installer/export refuse store-root destinations.

Next → [hitl-dreaming.md](./hitl-dreaming.md)
