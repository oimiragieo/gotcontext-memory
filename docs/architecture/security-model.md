# Security model

**Related:** [secrets feature](../features/secrets.md) · [canonical vs operational](../concepts/canonical-vs-operational.md) · [HONESTY](../HONESTY.md)

---

## Threats we actively mitigate

| Threat | Mitigation |
|---|---|
| Path traversal out of store (`../`, absolute, UNC) | `assertSafeRelativePath` + `resolveUnderStore` |
| Symlink/junction escape | Ancestor `lstat` + `realpath` containment |
| Credential leakage into memory | Pre-write secret scan (canonical + default operational) |
| Oversized index drowning agents | Hard MEMORY.md caps; reject, never truncate |
| Race clobber between processes | File locks + CAS `baseHash` |
| Silent memory mutation by dream | `memoryTreeHash` invariant |
| Half-applied accept (target without index) | Preflight + rollback on index failure |
| Proposal id traversal (`../x`) | `assertProposalId` regex + containment |
| Installer writing into the store as “adapter” | Refuse targets under `storeRoot` |
| Export archive unpacking into store | Archive must be absolute **outside** store; import uses `commit*` |
| Unprompted autonomous dreaming | Default `dream.enabled: false`; config rejects `schedule`/`auto` |
| Tampered managed instruction blocks | Content hash compare; refuse without `--force` |

---

## Threats we do **not** claim to solve

| Topic | Notes |
|---|---|
| Full OS permission / ACL scoping of transcripts | Basename `projectKey` only — see HONESTY |
| Malicious local user with filesystem access | They can edit files; CAS only helps concurrent writers using the API |
| Prompt injection inside accepted memory | Human gate is the control; review carefully |
| Network exfiltration | Package is local-first; no cloud sync |
| Full MCP authn/z | Thin local stdio tools; no remote auth model |

---

## Secret patterns (names)

From `src/secrets.ts`:

1. `aws_access_key` — `AKIA…`
2. `github_pat` — `ghp_…`
3. `generic_api_key` — `api_key` / `secret` + `sk-…`
4. `private_key_pem` — `BEGIN … PRIVATE KEY`

Allowlist is **config-owned** (`secrets.allowlist: string[]` of pattern names),
not caller-supplied on each commit. Decisions are recorded on revision
`.meta.json` / journal entries.

---

## Sole-writer invariant

Product law: store-root durable writes go through `MemoryStore`.

| Writer | Allowed targets |
|---|---|
| `store.ts` | Entire store root (canonical + operational APIs) |
| `installer.ts` | **External** harness files; store manifest via `MemoryStore` |
| `portability.ts` | External `.gcm.gz` via `createWriteStream`; import via `MemoryStore` |

Enforced by AST scan in `test/guards.test.ts` plus runtime refuse tests.

---

## Dependency surface

Pinned runtime deps (`package.json`): `commander`, `proper-lockfile`, `yaml`.
No omega / telegram / pipecat packages (guarded in tests).
Node `>=22.5.0` (Cursor sqlite uses experimental `node:sqlite`).

Next → pick a [feature](../features/memory-store.md) or [quickstart](../guides/quickstart.md)
