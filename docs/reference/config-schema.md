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
  }
}
```

---

## Rules

| Rule | Detail |
|---|---|
| Allowed top-level keys | `dream`, `memory`, `secrets` only |
| Forbidden | `dream.schedule`, `dream.auto` |
| Default enabled | `dream.enabled = false` |
| Allowlist entries | Pattern **names** from secrets.ts |

Unknown top-level keys throw `Unknown config key: …`.

← [CLI](./cli.md) · Next → [proposal-schema](./proposal-schema.md)
