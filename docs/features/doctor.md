# Feature: Doctor

**Code:** `src/doctor.ts`  
**Tests:** `test/doctor.test.ts`  
**Related:** [troubleshooting](../guides/troubleshooting.md)

---

## Purpose

One read-only diagnostic surface. Never auto-fixes. Never writes (tree hash
must be identical before/after).

---

## CLI

```bash
gotcontext-memory doctor --store user
# exit 0 if report.ok, else 1
# JSON on stdout
```

---

## Checks (current)

| name | Meaning |
|---|---|
| `config` | Config loaded; shows `dream.enabled` |
| `secret_scanner` | Planted AWS key must be detected (self-test) |
| `memories` | Count of `memory/**/*.md` parsed; `EMPTY` if zero (“proves nothing”) |
| `dangling_index` | MEMORY.md link target missing on disk → fail |
| `index_caps` | Current lines/bytes vs caps (informational pass) |
| `corpus_agy` / `corpus_opencode` | Always PARTIAL labels |
| `accept_error_receipt` | Any `receipts/*.error.json` → fail with code |

`report.ok` is false if any hard fail fired.

---

## Interpreting EMPTY

`memories: 0 — EMPTY, proves nothing` is **not** a clean bill of health. It means
the memories check had no subjects. Other checks (scanner self-test, index) still
matter.

---

## Known gaps (non-blocking)

PASS audit noted doctor does not yet fully verify revision/sidecar consistency,
adapter install state, or live corpus path scans beyond PARTIAL labels.

← [installer](./installer-adapters.md) · Next → [portability.md](./portability.md)
