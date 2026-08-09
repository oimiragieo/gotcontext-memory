# Troubleshooting

**Related:** [error catalog](../reference/error-catalog.md) · [doctor](../features/doctor.md)

---

## Symptom → likely cause → fix

### `Ambiguous store. Pass --store user|project`

Both `~/.gotcontext` and `<cwd>/.gotcontext` exist. Pass `--store` explicitly.

### `EMPTY_CORPUS — proves nothing`

Dream policy + importers produced zero kept transcripts. Check:

- `--source` matches files you think exist
- Non-Claude sources look under `<store>/fixtures/<name>` in the CLI
- `excludeSources` / `focus` did not filter everything

### `CasConflict`

Someone changed the file since you read it (or hand-edited). Re-read bytes,
recompute hash, retry. For accepts, regenerate the proposal from a fresh dream.

### `IndexCapExceeded` on accept

Preflight refused so memory was **not** mutated. Delete/expire old notes or
split content; do not raise caps casually.

### `SecretDetected`

Remove credentials from the body or add a **named pattern** to
`secrets.allowlist` only if it is a known false positive.

### `invalid proposal id`

Ids cannot contain `/` or `..`. Copy the id from `review list` exactly.

### `Managed block tampered … pass --force`

Human edited inside the managed markers. Review the diff; use `--force` only
if overwriting is intentional.

### `gcm` runs the wrong program

Windows Git Credential Manager. Use `gotcontext-memory` instead.

### Doctor `memories: EMPTY`

No notes yet — not a scanner failure. Check `secret_scanner` still passes.

### Doctor fails `accept_error_receipt`

Inspect `receipts/*.error.json`. Often a prior accept hit CAS/index issues;
fix the cause, remove or keep the receipt intentionally.

### Import `rejected > 0`

Some rows failed gates (secrets/CAS/path). Store should remain consistent;
read the import receipt under `receipts/`.

← [walkthrough](./first-dream-walkthrough.md) · Next → [contributing-tests.md](./contributing-tests.md)
