# Contributing tests

**Related:** [module map](../architecture/module-map.md) · Vitest in `package.json`

---

## Commands

```bash
npm test           # vitest run
npm run test:watch
npm run build      # tsc → dist/
```

CI (`.github/workflows/ci.yml`) runs on ubuntu/windows/macos, Node 22:
`npm ci` → `npm test` → `npm pack` → smoke `init` + `doctor` under a temp `HOME`.

---

## Laws we encode as tests

| Law | Example test |
|---|---|
| Bidirectional oracle | Secrets reject dirty + allow clean |
| Zero-label | Empty corpus → `EMPTY`, not silent `[]` |
| Dream non-mutation | Hash equal before/after dream |
| Accept preflight | Over-cap index → hash unchanged |
| Sole writer | AST forbids `writeFile` outside allowlist |
| Positive control | Fixture with `writeFile` is flagged by the same scanner |
| Cross-process CAS | Two children → one exit 0, one exit 1 |

---

## Adding a red arm

1. Write the failing test first (name it after the property)
2. Confirm it fails for the **right** reason
3. Implement the fix
4. Confirm green **and** that a control arm still fails when the bug is reintroduced (when practical)

---

## Fixtures

Under `test/fixtures/`:

- `transcripts/claude|codex|cursor/` — importer contracts
- `planted-secrets/` — reserved for scanner corpora
- Cursor `state.vscdb` created with `node:sqlite` for read-only import tests

Never point tests at the operator’s real `~/.gotcontext` or `~/.claude` — use
`mkdtemp`.

← [troubleshooting](./troubleshooting.md) · Next → [CLI reference](../reference/cli.md)
