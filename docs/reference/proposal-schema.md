# Proposal schema

**Code:** `Proposal` in `src/dream/run.ts` · **Feature:** [review](../features/review.md)

---

## JSON fields

```ts
{
  id: string,              // deterministic hash prefix (16 hex chars typically)
  action: "create" | "update" | "supersede" | "expire" | "delete",
  targetPath: string,      // e.g. memory/pref-abcd1234.md
  base_hash: string,       // sha256 hex or "absent"
  body: string,            // full markdown file body for create/update/…
  evidence: [{ transcriptId: string, quote: string }],
  createdAt: string,       // ISO timestamp
  expiresAt?: string       // ISO; accept refuses if past
}
```

---

## Id constraints

Must match `^[A-Za-z0-9._-]{1,128}$` when accepted/rejected/shown.

---

## Evidence rule

Extraction always attaches at least one quote. Treat proposals without evidence
as invalid if you extend the schema later — the plan requires evidence quotes.

← [config-schema](./config-schema.md) · Next → [error-catalog](./error-catalog.md)
