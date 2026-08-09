# Mental model — five objects

**Related:** [START-HERE](../START-HERE.md) · [glossary](../glossary.md) ·
[canonical vs operational](./canonical-vs-operational.md)

If you can draw these five boxes on a whiteboard, you understand the product.

---

## 1. The store root

A directory that *is* the product’s database:

- User: `~/.gotcontext/`
- Project: `<repo>/.gotcontext/`

Everything durable for this package lives under that root (except harness
instruction files written by the installer into `~/.claude/`, `AGENTS.md`, etc.).

See [store-layout.md](./store-layout.md).

---

## 2. Canonical memory

Only two path patterns:

- `MEMORY.md` — the index
- `memory/**/*.md` — individual memory notes (frontmatter + body)

These are the files `memoryTreeHash` covers. Agents should *read* them freely;
they must *write* them only through `MemoryStore.commitCanonical` (CLI/MCP).

---

## 3. Proposals (operational)

JSON files under `proposals/<id>.json` produced by `dream`. They describe a
*desired* change. Until `review accept` succeeds:

- Canonical bytes are untouched
- `memoryTreeHash` is unchanged

Accepted copies move to `proposals/accepted/`; rejected to `proposals/rejected/`.

Schema: [reference/proposal-schema.md](../reference/proposal-schema.md).

---

## 4. The human gate (review)

`accept` is the load-bearing function (`src/review.ts`):

1. Validate proposal id / schema / expiry
2. Preflight secrets + regenerated index caps
3. Under locks: write target (or delete/expire), then write `MEMORY.md`
4. On index failure: roll target back
5. Move proposal to `accepted/` + write receipt

Dreaming without review is intentionally useless for durable memory.

---

## 5. Harness adapters (outside the store)

`init` writes a managed markdown/rules block into each detected harness’s native
instruction file. That tells the agent *where memory lives* and *not to rewrite
it silently*. Those files are **outside** the store root; the installer is the
allowed carve-out for that.

Manifest of what was touched lives *inside* the store as
`installer-manifest.json` (via `commitOperational`).

---

## Picture

```text
┌──────────────────────────────────────────────────────────┐
│ Store root (~/.gotcontext or ./.gotcontext)              │
│                                                          │
│  MEMORY.md ─┐                                            │
│  memory/* ──┼── canonical  ←── review accept only        │
│             │                                            │
│  proposals/ ── operational ←── dream writes here         │
│  revisions/ ── operational ←── store keeps history       │
│  receipts/  ── operational ←── accept/import diagnostics │
│  config.json── operational                               │
└──────────────────────────────────────────────────────────┘
         ▲                              │
         │ commitCanonical              │ managed blocks
         │                              ▼
   CLI / MCP                    ~/.claude/CLAUDE.md, AGENTS.md, …
```

---

## Common confusions

| Confusion | Clarification |
|---|---|
| “Dream updated my memory” | It didn’t — you accepted a proposal, or something wrote outside the CLI |
| “Tree hash changed after dream” | Bug — dream must abort if that happens |
| “I edited `memory/foo.md` by hand” | Allowed; next commit must use the *new* on-disk hash as `baseHash` |
| “Permission-scoped means OS ACLs” | No — basename projectKey filtering; see HONESTY |

Next → [store-layout.md](./store-layout.md)
