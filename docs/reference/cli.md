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
| `--source` | `all` | Which harness logs to digest. `opencode` also reads the real OpenCode **SQLite store** (`$XDG_DATA_HOME/opencode/opencode.db`, else `~/.local/share/...`) — reported as its own `opencode-db` summary row |
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
  [--max-sessions 400] \
  [--propose-expiry] \
  [--expiry-justification mechanized|environment-changed]
```

Scores accepted `memory/pattern-*.md` notes against sessions **after** acceptance.
Verdicts: `RESOLVED` · `DORMANT` · `PERSISTING` · `INSUFFICIENT_DATA` ·
`UNPARSEABLE_NOTE`.

Only notes whose landing into canonical memory is actually on record as
**landed** are scored — a note with a recorded `refused`/`skipped` outcome for
its exact text (import-outcome ledger, `efficacy/import-outcomes.jsonl`) is
excluded; no record at all is legacy behavior (scored as before).

Each result also carries:

- `streak` — consecutive scoring runs with the same verdict (history-backed:
  `efficacy/history.jsonl`, operational storage; `memoryTreeHash` untouched).
- `model_verdicts` — per-model `RESOLVED`/`PERSISTING` where that model has ≥5
  post-acceptance sessions; thinner windows are never judged.
- `recommend_mechanize` — set on `PERSISTING` at streak ≥2: the note is not
  working; the fix is a mechanism, not a re-worded note. A recommendation only —
  this toolkit never installs hooks.
- `expiry_recommendation` (`EXPIRE`/`RETAIN`) — set whenever a note is otherwise
  expiry-eligible (`RESOLVED`, streak ≥2, ≥15 post-acceptance sessions),
  regardless of `--propose-expiry`. `EXPIRE` only appears alongside
  `expiry_justification`; without one it is always `RETAIN` — see
  [efficacy.md](../features/efficacy.md#cure-vs-treatment).

`--propose-expiry` + `--expiry-justification mechanized|environment-changed`:
files an `expire` **proposal** through the normal review flow (idempotent; notes
already carrying `expires` are skipped). **A human still accepts** — scoring
never touches canonical memory. `--propose-expiry` WITHOUT a justification is a
no-op: `expiry_recommendation` still computes as `RETAIN`, nothing gets filed —
cure vs treatment: a note can score `RESOLVED` precisely because it is loaded
every session, and expiring it would make the failure return unscored.

Exit **1** if any note is `PERSISTING` or `UNPARSEABLE_NOTE`.  
See [efficacy.md](../features/efficacy.md).

---

## `report` / `ingest-decisions`

```bash
gotcontext-memory report \
  [--source claude|codex|cursor|agy|opencode|all] \
  [--scope user|project] [--store user|project] \
  [--max-sessions 400] \
  [--expiry-justification mechanized|environment-changed] \
  [--out report.html]

gotcontext-memory ingest-decisions [file=decisions.json]
```

`report` runs `efficacy` and writes a self-contained `report.html` listing
pending decision items: expiry candidates (`RETAIN`/`EXPIRE` recommendation) and
`DORMANT`/`PERSISTING` notes needing attention. Opens from `file://`, no server —
Approve/Deny/Defer per item (deny requires a reason), Save writes
`decisions.json` locally via `window.showSaveFilePicker`. Items already decided
(`efficacy/report-decisions.jsonl`) are not shown again.

`ingest-decisions` reads a saved decisions file — **basename only**, resolved
under `cwd` (rejects any path separator or `..`) — and applies it: approvals on
an expiry item file the same `expire` proposal (still reviewed at `review
accept`); denials record a reason so the item is never re-proposed; defers are
no-ops. The file is renamed to `<name>.done` after every decision lands, so a
re-run can never double-fire.

Optional triage adapter: config `report.triageCommand` (a string, or an array —
each entry its own seat). Eligible items are piped (item text on stdin); the
LAST line matching `RECOMMENDED:\s*(APPROVE|DENY)` is that seat's verdict.
Unanimous `DENY` auto-suppresses with reason `council: unanimous DENY`;
unanimous `APPROVE` auto-actions and records `council: unanimous APPROVE`;
anything else — a split, a missing verdict line, a spawn failure — fails open to
the human report. Council is **optional**; the human report is the default. See
[HONESTY.md](../HONESTY.md).

---

## `usage`

```bash
gotcontext-memory usage \
  [--source claude|codex|cursor|agy|opencode|all] \
  [--skills-dir <path>] \
  [--max-sessions 400]
```

Skill-usage telemetry **derived from digests** (portable across every ingested
harness). `--skills-dir` points at a registry of `<name>/SKILL.md` folders and
supplies the denominator: without it, never-used skills are invisible.

States: `active` · `stale` · `archive-candidate` · `never-used` ·
`too-new-to-judge` (registry dir younger than 14 days — the grace floor: zero
uses on a fresh install is absence of evidence, not proof of disposability) ·
`unregistered` (invoked but absent from the registry — reported, never dropped).

**REPORT-ONLY.** Never archives, deletes, or edits a skill.

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
