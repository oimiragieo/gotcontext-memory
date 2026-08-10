# CLI reference

**Code:** `src/cli.ts`  
**Binary:** `gotcontext-memory` (alias `gcm` — avoid on Windows if GCM conflict)

Global option: `--store <user|project>`

---

## `init`

```bash
gotcontext-memory init [--project] [--dry-run] [--force] [--mcp]
```

| Flag | Meaning |
|---|---|
| `--project` | Create `<cwd>/.gotcontext` instead of `~/.gotcontext` |
| `--dry-run` | Print adapter plan; no store init writes when used as dry-run path |
| `--force` | Overwrite tampered managed blocks |
| `--mcp` | Print guidance to run `mcp` (does not register configs) |

---

## `uninstall`

```bash
gotcontext-memory uninstall [--store user|project]
```

Restores adapter pre-images; clears manifest via MemoryStore.

---

## `dream`

```bash
gotcontext-memory dream \
  [--source claude|codex|cursor|agy|opencode|all] \
  [--scope user|project] \
  [--store user|project] \
  [--force] \
  [--max-sessions 400]
```

| Flag | Default | Meaning |
|---|---|---|
| `--source` | `all` | Which harness logs to digest |
| `--scope` | (store tier) | Store / optional projectKey filter |
| `--force` | off | Run when `dream.enabled` is false |
| `--max-sessions` | `400` | Stratified window size **per source** (≈2/3 newest + older strata) |

Digests `*.jsonl` and Cursor `*.vscdb` concurrently, then emits preference +
prevalence proposals. See [dream.md](../features/dream.md).

Stdout includes `patterns`, `suppressedRejected`, `truncated` (≠ `malformed`).
Exit 1 on `EMPTY_CORPUS` or dreaming disabled without `--force`.

---

## `efficacy`

```bash
gotcontext-memory efficacy \
  [--source claude|codex|cursor|agy|opencode|all] \
  [--scope user|project] \
  [--store user|project] \
  [--max-sessions 400]
```

Scores accepted `memory/pattern-*.md` notes against sessions **after** acceptance.
Verdicts: `RESOLVED` · `PERSISTING` · `INSUFFICIENT_DATA` · `UNPARSEABLE_NOTE`.

Exit **1** if any note is `PERSISTING` or `UNPARSEABLE_NOTE`.  
See [efficacy.md](../features/efficacy.md).

---

## `review`

```bash
gotcontext-memory review list
gotcontext-memory review show <id>
gotcontext-memory review reject <id> [--reason text]
gotcontext-memory review accept <id> --yes [--yes-delete]
```

---

## `doctor`

```bash
gotcontext-memory doctor [--store …]
```

JSON report; exit 1 if `ok` is false.

---

## `export` / `import`

```bash
gotcontext-memory export --out /abs/path.gcm.gz
gotcontext-memory import --from /abs/path.gcm.gz --merge
gotcontext-memory import --from /abs/path.gcm.gz --replace
```

---

## `mcp`

```bash
gotcontext-memory mcp [--store …]
```

Stdio JSON-RPC loop. `memory_commit` is **default-off** (`mcp.allowCommit: false`).
See [mcp.md](../features/mcp.md).

← [Hub](../README.md)
