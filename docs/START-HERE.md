# Start here

**Audience:** junior analysts, new contributors, anyone who has never seen a
“memory + dreaming” package for coding agents.

**Related:** [Documentation hub](./README.md) · [Glossary](./glossary.md) ·
[Honesty](./HONESTY.md)

---

## One-sentence product

Gotcontext Memory is a **local markdown memory folder** plus a **human-in-the-loop
(HITL) dreaming loop** that turns agent chat transcripts into *proposals* a human
must accept before anything becomes durable memory.

---

## The problem it solves

Coding agents (Claude Code, Codex, Cursor, etc.) forget across sessions unless
someone maintains notes. Teams want:

1. A **shared, inspectable** memory format (plain markdown files — not a opaque DB).
2. Agents that **propose** lasting facts from transcripts — without silently rewriting
   memory behind a human’s back.
3. The same story across **multiple harnesses**, without depending on omega-jarvis,
   Telegram, or a cloud sync service.

This package is that story, as a Node CLI (`gotcontext-memory` / optional `gcm`).

---

## What it is *not*

Read [HONESTY.md](./HONESTY.md) before demos. Short version:

| Claim people might assume | Reality in v0.9 |
|---|---|
| Auto-applies dream findings to memory | **No** — human `review accept` required |
| Full omega `memory_dream` parity | **No** — HITL transcript dream only |
| Cloud sync / team org tier | **No** |
| Daemon that dreams on a schedule | **No** in v1 (and config forbids schedule keys) |
| Full MCP SDK server | **No** — thin JSON-RPC “MCP-like” tools |

---

## The loop (memorize this)

```text
  transcripts on disk
         │
         ▼
   corpus importers  ──► normalized Transcript[]
         │
         ▼
   gcm dream         ──► proposals/*.json   (operational only)
         │                  memoryTreeHash UNCHANGED
         ▼
   human review
     ├─ reject  ──► proposals/rejected/   (still no canonical change)
     └─ accept  ──► commitCanonical(target) + MEMORY.md
                         │
                         ▼
                   durable memory/*.md
```

If you remember only one thing: **dream never writes canonical memory;
accept does.**

Deep dive: [concepts/hitl-dreaming.md](./concepts/hitl-dreaming.md).

---

## Where data lives

| Tier | Default path | When |
|---|---|---|
| User | `~/.gotcontext/` | Normal personal install |
| Project | `<cwd>/.gotcontext/` | `init --project` |

Inside either root you will see `MEMORY.md`, `memory/`, `proposals/`,
`revisions/`, `receipts/`, `config.json`, and (after install) `installer-manifest.json`.

Deep dive: [concepts/store-layout.md](./concepts/store-layout.md).

---

## Commands you will use most

```bash
gotcontext-memory init                 # create store + adapter fragments
gotcontext-memory dream --source claude
gotcontext-memory review list
gotcontext-memory review show <id>
gotcontext-memory review accept <id> --yes
gotcontext-memory doctor
```

Full CLI: [reference/cli.md](./reference/cli.md).  
Hands-on: [guides/quickstart.md](./guides/quickstart.md).

---

## Source code orientation (30 seconds)

| Concern | Primary file(s) |
|---|---|
| Sole writer / CAS | `src/store.ts` |
| CLI entry | `src/cli.ts` |
| Dream extraction | `src/dream/run.ts` |
| Human accept/reject | `src/review.ts` |
| Transcript parsers | `src/corpus/*` |
| Adapter install | `src/installer.ts`, `src/adapters/types.ts` |

Full map: [architecture/module-map.md](./architecture/module-map.md).

---

## Suggested next read

→ [concepts/mental-model.md](./concepts/mental-model.md)
