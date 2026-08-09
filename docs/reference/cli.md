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
gotcontext-memory dream [--source name] [--scope user|project] [--store …] [--force]
```

`--source` default `all`. See [dream.md](../features/dream.md).

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

Stdio JSON-RPC loop. See [mcp.md](../features/mcp.md).

← [Hub](../README.md)
