# Start here

**Audience:** junior analysts, new contributors, anyone rebuilding the system.  
**Related:** [Documentation hub](./README.md) · [Rebuild from scratch](./guides/rebuild-from-scratch.md) ·
[Honesty](./HONESTY.md) · [Skills](./SKILLS.md) · [Lessons](./LESSONS_2026-08-09.md)

---

## One-sentence product

Gotcontext Memory is a **local markdown memory folder** plus a **human-in-the-loop
dreaming loop** that turns agent chat logs into *proposals* a human must accept —
and an **efficacy** check that asks whether accepted pattern notes actually helped.

---

## The problem it solves

Coding agents forget across sessions. Teams want:

1. Inspectable markdown memory (not an opaque cloud DB).
2. Agents that **propose** lasting facts — never silently rewrite memory.
3. The same story across Claude / Codex / Cursor / agy / OpenCode.

---

## What it is *not*

| People assume | Reality in v0.9 |
|---|---|
| Auto-applies dream findings | **No** — human `review accept` |
| Full omega LLM dream | **No** — regex prefs + counted prevalence |
| Dreams all of history | **No** — stratified `--max-sessions` (default 400) |
| MCP rewrites memory freely | **No** — `mcp.allowCommit` default off |
| Daemon / scheduler | **No** |
| Efficacy auto-deletes notes | **No** — reports verdicts only |

Full claim list: [HONESTY.md](./HONESTY.md).

---

## The loop (memorize this)

```text
  transcripts (*.jsonl + Cursor *.vscdb)
         │
         ▼
   digestRoots       ──► SessionDigest[]  (streamed/concurrent; stratified window)
         │                  truncated ≠ malformed
         ▼
   dream             ──► proposals/*.json   (prefs + prevalence; memory unchanged)
         │
         ▼
   human review
     ├─ reject  ──► proposals/rejected/   (claimKey blocks resurrection)
     └─ accept  ──► memory/*.md + MEMORY.md (+ proposals/accepted/)
                         │
                         ▼
                   efficacy   ──► RESOLVED / PERSISTING / INSUFFICIENT_DATA / …
```

**Dream never writes canonical memory; accept does. Efficacy never writes memory either.**

Default install: `dream.enabled: false` → pass `--force` (or flip the flag).

---

## Commands you will use most

```bash
gotcontext-memory init
gotcontext-memory dream --source all --force --max-sessions 400
gotcontext-memory review list
gotcontext-memory review accept <id> --yes
gotcontext-memory efficacy --source all
gotcontext-memory doctor
```

Hands-on: [quickstart](./guides/quickstart.md) · [rebuild guide](./guides/rebuild-from-scratch.md) ·
[first walkthrough](./guides/first-dream-walkthrough.md).

---

## Where data lives

| Tier | Path |
|---|---|
| User | `~/.gotcontext/` |
| Project | `<cwd>/.gotcontext/` (`init --project`) |

Inside: `MEMORY.md`, `memory/`, `proposals/`, `revisions/`, `receipts/`, `config.json`.

---

## Source map (30 seconds)

| Concern | File(s) |
|---|---|
| Digests, window, `.vscdb`, concurrency | `src/dream/digest.ts` |
| Prefs / prevalence / claimKey | `src/dream/run.ts` |
| Efficacy | `src/dream/efficacy.ts` |
| Accept / locks | `src/review.ts` |
| Sole store writer | `src/store.ts` |
| CLI | `src/cli.ts` |

---

## Suggested next read

→ [guides/rebuild-from-scratch.md](./guides/rebuild-from-scratch.md)  
→ [concepts/mental-model.md](./concepts/mental-model.md)  
→ [features/dream.md](./features/dream.md) · [features/efficacy.md](./features/efficacy.md)
