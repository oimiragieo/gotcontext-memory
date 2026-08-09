# CAS and hashing

**Code:** `src/store.ts`, `src/hash.ts`  
**Related:** [memory-store](../features/memory-store.md) · [error catalog](../reference/error-catalog.md)

---

## Why CAS exists

Two writers (two CLI processes, or human edit + agent) must not clobber each
other silently. Every canonical write says:

> “I believe the file currently hashes to `baseHash`. If not, refuse.”

That is **compare-and-swap** (CAS).

---

## `sha256Hex`

```ts
sha256Hex(bytes: Buffer | string) → 64-char hex
```

Used for file content hashes and as building blocks of `memoryTreeHash`.

---

## `baseHash` rules

| Situation | `baseHash` value |
|---|---|
| Creating a new canonical file | `"absent"` (`BASE_ABSENT`) |
| Updating an existing file | `sha256Hex(currentBytes)` |
| File exists but you claimed `"absent"` | `CasConflict` |
| File missing but you claimed a hash | `CasConflict` |
| Stale hash (someone else wrote first) | `CasConflict` |

On conflict the store **does not** write a tempfile; existing bytes stay put.
Proven by `test/store.test.ts` (including a two-process race: exactly one wins).

---

## Atomic write pattern

Inside `commitCanonicalLocked`:

1. Secret scan + (for `MEMORY.md`) index caps — **before** any write
2. Read current hash; compare to `baseHash`
3. If replacing: write revision body + `.meta.json`
4. Write tempfile → `fsync`-style close → `rename` onto target
5. Append journal line to `commits.jsonl`

Locks: `proper-lockfile` on the target (or a stub under `locks/` if the file
does not exist yet). Multiple paths in one accept session are locked in sorted
order via `withCanonicalLocks`.

---

## `memoryTreeHash`

Definition (`src/hash.ts`):

1. Walk `memory/**/*.md`, record `relPath → sha256(file)`
2. Include `MEMORY.md` the same way
3. Sort by relative path
4. Hash the joined `path:hash` lines

**Ignores:** proposals, revisions, receipts, config, journal, locks.

### Why that matters

| Operation | Must `memoryTreeHash` change? |
|---|---|
| `dream` | **No** (asserted; abort if yes) |
| `review reject` | **No** |
| `review accept` (success) | **Yes** (target and/or index) |
| `commitOperational` for a proposal | **No** |
| Hand-edit `memory/x.md` | **Yes** next time it is recomputed |

---

## Human edits

Editing a memory file with a text editor is allowed. There is **no** silent
reconcile. The next committer must:

1. Read current bytes
2. Use their hash as `baseHash`
3. Or run `doctor` if things look inconsistent

See [HONESTY.md](../HONESTY.md).

---

## Rollback

`MemoryStore.rollback(path, hashPrefix, provenance)` finds a revision whose
hash starts with `hashPrefix`, then `commitCanonical`s those bytes as a *new*
revision (it does not delete history).

Next → [canonical-vs-operational.md](./canonical-vs-operational.md)
