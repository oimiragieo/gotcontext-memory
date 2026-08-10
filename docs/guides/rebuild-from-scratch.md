# Rebuild from scratch (junior guide)

**Audience:** someone who could rebuild or verify this package without tribal knowledge.  
**As of:** 2026-08-10 (`beda78e` / efficacy + stratified window + `.vscdb` on digest path).  
**Version:** 0.9.0

If a sentence below disagrees with [HONESTY.md](../HONESTY.md), HONESTY wins.

---

## 0. What you are building

A Node CLI that:

1. Reads coding-agent transcripts from disk (`*.jsonl` and Cursor `*.vscdb`).
2. Compresses each session into a small **digest**.
3. Proposes markdown memory notes (preferences + recurring pains).
4. Waits for a **human** to accept or reject.
5. Later scores accepted **pattern** notes with **`efficacy`**.

It is **not** an LLM dreamer and **not** an auto-writer of memory.

---

## 1. Toolchain

| Need | Check |
|---|---|
| Node | `node -v` → **≥ 22.5.0** |
| Package manager | `npm` (repo uses npm, not pnpm) |
| OS | Linux / macOS / Windows / WSL all OK for unit tests |

```bash
cd /path/to/gotcontext-memory
npm install
npm run build
npm test
npm run lint
```

Expect: TypeScript build OK, Biome clean, **all** vitest files green (105+ as of this writing).

Optional link:

```bash
npm link
gotcontext-memory --help
```

---

## 2. Mental model (five folders)

Store root (`~/.gotcontext` or `<cwd>/.gotcontext`):

| Path | Role |
|---|---|
| `memory/*.md` | Durable notes (canonical) |
| `MEMORY.md` | Index of those notes (capped; regenerate under lock) |
| `proposals/*.json` | Pending dream output |
| `proposals/rejected/` | Rejected claims (suppression) |
| `proposals/accepted/` | Accepted archive (dates efficacy) |
| `config.json` | `dream.enabled`, `mcp.allowCommit`, policy |

**Rule:** only `MemoryStore` (`src/store.ts`) mutates the store root.

---

## 3. Rebuild the dream loop yourself

### 3a. Sandbox home (do not trash real memory)

```bash
export HOME=/tmp/gcm-rebuild-$$
mkdir -p "$HOME"
gotcontext-memory init
gotcontext-memory doctor
```

### 3b. Dream (needs real or fixture transcripts)

```bash
gotcontext-memory dream --source claude --force --max-sessions 400
gotcontext-memory review list
```

If you have no Claude logs, use the package tests / Docker verify instead of inventing paths.

### 3c. Accept one proposal

```bash
gotcontext-memory review show <id>
gotcontext-memory review accept <id> --yes
```

Confirm a file appeared under `memory/` and `MEMORY.md` lists it.

### 3d. Efficacy (after more sessions exist)

```bash
gotcontext-memory efficacy --source all
```

Read verdicts in the JSON. `PERSISTING` / `UNPARSEABLE_NOTE` → exit code 1.

---

## 4. Module map (where to edit)

| Job | Start here |
|---|---|
| Stream digests, stratified window, concurrency, `.vscdb` | `src/dream/digest.ts` |
| Preferences, prevalence, claimKey, YAML-safe notes | `src/dream/run.ts` |
| Efficacy scoring | `src/dream/efficacy.ts` |
| Accept / reject under locks | `src/review.ts` |
| CAS + secret scan | `src/store.ts`, `src/secrets.ts` |
| CLI flags | `src/cli.ts` |
| Cursor SQLite reader | `src/corpus/cursor.ts` |

---

## 5. Contracts you must not break

1. Dream writes **proposals only**.
2. `mcp.allowCommit` defaults **false**.
3. Locks always `locks/<sha256(rel)>.lock`.
4. Regenerate `MEMORY.md` **while still holding** accept locks.
5. `truncated` ≠ `malformed`.
6. Window is **stratified**, not naive newest-N.
7. Rejected → `claimKey`; accepted prefs → skip if path exists.
8. Preference regex stays anchored (`please remember` / `from now on`).
9. Efficacy: &lt;5 post-accept sessions → `INSUFFICIENT_DATA` only.
10. Frontmatter scalars go through `yamlScalar`.

---

## 6. Proof commands (copy/paste)

```bash
npm test -- test/digest.test.ts test/digest-vscdb.test.ts test/digest-window.test.ts
npm test -- test/dream-suppression.test.ts test/efficacy.test.ts
npm test -- test/dream.test.ts test/review.test.ts
npm run lint && npm run build
```

Docker matrix (Windows host with Docker Desktop):

```powershell
npm run verify:docker
```

---

## 7. Reading order after this page

1. [START-HERE.md](../START-HERE.md)  
2. [HONESTY.md](../HONESTY.md)  
3. [features/dream.md](../features/dream.md)  
4. [features/efficacy.md](../features/efficacy.md)  
5. [LESSONS_2026-08-09.md](../LESSONS_2026-08-09.md) (esp. L15–L24)  
6. [SKILLS.md](../SKILLS.md) if you are an agent
