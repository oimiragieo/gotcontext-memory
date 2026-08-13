# Config schema (`config.json`)

**Code:** `src/config.ts` · **Feature:** [config-and-tiers](../features/config-and-tiers.md)

---

## Shape

```json
{
  "dream": {
    "enabled": false,
    "policy": {
      "excludeSources": ["cursor"],
      "focus": ["testing", "commits"],
      "maxProposals": 20
    }
  },
  "memory": {
    "policy": {
      "tone": "concise",
      "never": "commit secrets"
    }
  },
  "secrets": {
    "allowlist": []
  },
  "report": {
    "triageCommand": "path/to/triage-seat"
  }
}
```

`report.triageCommand` may also be an array of commands — each entry runs as
its own council seat for `report`'s optional triage adapter (unanimity required
to auto-decide; anything else fails open to the human report). See
[efficacy.md](../features/efficacy.md#hitl-decision-report-report--ingest-decisions)
and [HONESTY.md](../HONESTY.md).

---

## Rules

| Rule | Detail |
|---|---|
| Allowed top-level keys | `dream`, `memory`, `secrets`, `mcp`, `report` |
| Forbidden | `dream.schedule`, `dream.auto` |
| Default enabled | `dream.enabled = false` |
| Allowlist entries | Pattern **names** from secrets.ts |
| `report.triageCommand` | Optional, unset by default — no council unless configured |

Unknown top-level keys throw `Unknown config key: …`.

← [CLI](./cli.md) · Next → [proposal-schema](./proposal-schema.md)
