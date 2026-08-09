# Feature: Config and store tiers

**Code:** `src/config.ts`, `src/paths.ts`, `openStore` in `src/cli.ts`  
**Tests:** `test/config.test.ts`  
**Reference:** [config-schema.md](../reference/config-schema.md)

---

## Store tiers

| Tier | Path helper | Default root |
|---|---|---|
| `user` | `userStoreRoot(home)` | `~/.gotcontext` |
| `project` | `projectStoreRoot(cwd)` | `<cwd>/.gotcontext` |

### Resolution rules (`resolveStoreRoot` / CLI `openStore`)

1. `--store project` — require project dir exists, else error with valid options.
2. `--store user` — use user root (may be created by `init`).
3. No flag — if project store **exists**, refuse as **ambiguous** (must pass `--store`).
4. No flag and no project store — use user root.

This matches the “never guess” closed-vocabulary pattern from the plan.

---

## `config.json`

Default (via `DEFAULT_CONFIG` / `defaultConfigJson()`):

```json
{
  "dream": { "enabled": false, "policy": {} },
  "memory": { "policy": {} },
  "secrets": { "allowlist": [] }
}
```

### Validation highlights

- Top-level keys only: `dream`, `memory`, `secrets`
- Forbidden: `dream.schedule`, `dream.auto`, and bare `schedule`/`auto` under dream
- Unknown top-level keys → throw naming the key

`dream.enabled` is informational for operators today; dreaming is still an
explicit CLI action (no scheduler). Keeping the default `false` documents intent.

### Policy fields

Under `dream.policy`:

| Field | Effect |
|---|---|
| `excludeSources` | Drop transcripts by `source` name |
| `focus` | Keep transcripts whose text contains a keyword |
| `maxProposals` | Cap proposals after extraction (extras counted in `dropped`) |

Under `memory.policy`: arbitrary key/value pairs rendered into adapter fragments
as `- memory.policy.<k>: <json>` lines (steering text for agents).

---

## Merged project-over-user reads

**Not implemented in v0.9** as a single merged view with per-entry provenance.
Operators pick an explicit tier for writes. Tracked as a known non-blocking gap
in the PASS audit.

← [memory-index](./memory-index.md) · Next → [corpus-importers.md](./corpus-importers.md)
