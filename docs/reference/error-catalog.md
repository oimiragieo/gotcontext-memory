# Error catalog

**Related:** [troubleshooting](../guides/troubleshooting.md)

| Name / message fragment | Origin | Meaning |
|---|---|---|
| `CasConflict` | store | `baseHash` ≠ on-disk hash |
| `IndexCapExceeded` | store / review preflight | MEMORY.md would exceed caps |
| `SecretDetected` | secrets / store / dream | Credential pattern found |
| `Path containment violation` | paths | `..`, absolute, drive, UNC, `~` |
| `Symlink escape` | paths | Link resolves outside store |
| `Canonical path required` | store | Non-`memory/**` or non-`MEMORY.md` in canonical API |
| `withCanonicalLocks only for canonical paths` | store | Lock list included non-canonical path |
| `invalid proposal id` | review | Bad id characters / traversal |
| `proposal expired` | review | `expiresAt` in the past |
| `delete requires --yes-delete` | review | Missing confirmation |
| `EMPTY_CORPUS` | dream | No kept transcripts after policy |
| `Dream mutated canonical memoryTreeHash` | dream | Invariant violated — abort |
| `Ambiguous store` | CLI / paths | Both tiers present; pass `--store` |
| `Project store missing` / `not present` | CLI / paths | `--store project` without init |
| `Managed block tampered` | installer | Hash mismatch; need `--force` |
| `Installer refuses store-root target` | installer | Adapter path under store |
| `export archive must not target the store root` | portability | Bad `--out` |
| `import requires --merge or --replace` | CLI | Mode missing |
| `INDEX_DRIFT_OR_CAS` | review receipt | Accept failed after/during canonical phase |

← [proposal-schema](./proposal-schema.md) · [Hub](../README.md)
