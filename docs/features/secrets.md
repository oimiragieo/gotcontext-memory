# Feature: Secret scanning

**Code:** `src/secrets.ts`  
**Tests:** `test/secrets.test.ts`  
**Related:** [security model](../architecture/security-model.md) · [config schema](../reference/config-schema.md)

---

## Purpose

Prevent obvious credentials from being committed into durable memory (and, by
default, into operational writes).

---

## API

```ts
scan(text: string, allowlist: string[] = []): SecretFinding[]
// SecretFinding = { pattern: string, preview: string }

class SecretDetected extends Error {
  findings: SecretFinding[]
}
```

`MemoryStore` throws `SecretDetected` when `scan` returns any findings.

---

## Patterns

| Name | Matches |
|---|---|
| `aws_access_key` | `\bAKIA[0-9A-Z]{16}\b` |
| `github_pat` | `\bghp_[A-Za-z0-9]{36,}\b` |
| `generic_api_key` | `api_key`/`secret` + `sk-…` |
| `private_key_pem` | `-----BEGIN … PRIVATE KEY-----` |

The word “secret” in ordinary prose does **not** match — patterns are token-shaped.

---

## Allowlist

In `config.json`:

```json
{
  "secrets": { "allowlist": ["aws_access_key"] }
}
```

- Names must match pattern **names**, not the secret strings.
- Loaded into the store via `reloadConfig()` — **not** taken from commit callers.
- Recorded on revision metadata when a replace happens.

---

## Where scanning runs

| Path | Scans? |
|---|---|
| `commitCanonical` | Always |
| `commitOperational` | Yes unless `scanSecrets: false` |
| Dream proposal body+quotes | Yes (withheld if hit) |
| Accept preflight (target + index) | Yes |
| Doctor self-test | Planted AWS key must produce ≥1 finding |

---

## Bidirectional proof (why tests matter)

A scanner that never fires looks “clean.” Tests plant real-shaped secrets and
assert rejection **and** a clean control commits. Doctor also self-tests every run.

← [memory-store](./memory-store.md) · Next → [memory-index.md](./memory-index.md)
