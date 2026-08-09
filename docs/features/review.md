# Feature: Review (HITL accept/reject)

**Code:** `src/review.ts`  
**Tests:** `test/dream.test.ts`, proposal-id arms in `test/guards.test.ts`  
**Reference:** [proposal-schema](../reference/proposal-schema.md) · [errors](../reference/error-catalog.md)

---

## CLI

```bash
gotcontext-memory review list
gotcontext-memory review show <id>
gotcontext-memory review reject <id> --reason "…"
gotcontext-memory review accept <id> --yes
gotcontext-memory review accept <id> --yes --yes-delete   # for action=delete
```

`accept` requires `--yes` on a named id (no bulk accept-all).

---

## Proposal id safety

```ts
assertProposalId(id) // ^[A-Za-z0-9._-]{1,128}$
```

Reads go through `store.read("proposals/<id>.json")` — never raw
`path.join(root, userString)` without validation.

---

## Reject

1. Copy JSON to `proposals/rejected/` with reason
2. Remove pending file
3. Assert `memoryTreeHash` identical

---

## Accept (load-bearing)

### Validations

- Schema: `targetPath`, `action`, `base_hash` required
- `expiresAt` in the past → refuse
- `action === "delete"` requires `{ yesDelete: true }`

### Overlay + preflight

Build overlay upserts/deletes from the action (`expire` writes `expires`
frontmatter rather than deleting). Regenerate index bytes. Then:

1. Secret-scan target (unless delete)
2. `checkIndexCaps(indexBytes)`
3. Secret-scan index

**No canonical mutation before preflight passes.**

### Locked session

```text
withCanonicalLocks([targetPath, "MEMORY.md"])
  apply target (create/update/supersede | expire | delete)
  try:
    commit MEMORY.md
  catch:
    rollback target to pre-image (or delete if it was create)
    rethrow
```

On any error after starting accept: write `receipts/<id>.error.json` with
`code: "INDEX_DRIFT_OR_CAS"` (doctor surfaces these).

### Success epilogue

1. `proposals/accepted/<id>.json`
2. Remove pending
3. `receipts/<id>.json` status accepted

---

## Actions cheat-sheet

| action | Canonical effect |
|---|---|
| `create` / `update` / `supersede` | `commitCanonical` body at `targetPath` |
| `expire` | Rewrite note with `expires` frontmatter (still a file) |
| `delete` | `deleteCanonical` after `--yes-delete` |

← [dream](./dream.md) · Next → [installer-adapters.md](./installer-adapters.md)
