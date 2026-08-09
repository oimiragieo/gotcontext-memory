# Feature: MEMORY.md index

**Code:** `src/index.ts`, caps in `src/store.ts`  
**Tests:** `test/dream.test.ts` (determinism + accept cap preflight)  
**Related:** [store layout](../concepts/store-layout.md)

---

## Purpose

Give agents and humans a **single progressive-disclosure entrypoint**: a short
index that links into deeper `memory/*.md` files.

---

## `regenerateIndex(store, overlay?, opts?)`

**Pure with respect to writes:** it *reads* the store (and optional overlay
maps) and **returns a string**. It never calls `writeFile`. Callers must
`commitCanonical` the result if they want it persisted.

### Overlay

Used by accept *before* the target exists on disk:

```ts
{
  upserts?: Record<string, string>,  // path → body
  deletes?: string[],
}
```

### `opts.nowMs`

Optional clock for expiry filtering (deterministic tests / audits). Defaults to
`Date.now()`.

### Line format

```markdown
# Memory index

- [Title](memory/foo.md) — hook from description or first body line
```

Files with frontmatter `expires` ≤ now are omitted from the index (the file may
still exist on disk until deleted).

---

## Caps

```ts
LINE_CAP = 200
BYTE_CAP = 25 * 1024
```

Enforced by `checkIndexCaps` on every `MEMORY.md` canonical commit **and**
during accept preflight (so we never half-apply a target that would force an
over-cap index).

On overflow: throw `IndexCapExceeded` naming lines/bytes vs caps. **Never**
auto-truncate (summarising the index would change behavior silently).

← [secrets](./secrets.md) · Next → [config-and-tiers.md](./config-and-tiers.md)
