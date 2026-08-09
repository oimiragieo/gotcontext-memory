# Gotcontext Memory — Documentation Hub

Welcome. This folder is the **operator + analyst guide** to the `gotcontext-memory` package.

If you are new, start here and follow the reading path below. Every feature page
links back to concepts and forward to CLI/reference so the ecosystem stays
navigable.

---

## Start here (junior path)

| Step | Doc | Why |
|---|---|---|
| 1 | [START-HERE.md](./START-HERE.md) | What this product is / is not, in plain language |
| 2 | [concepts/mental-model.md](./concepts/mental-model.md) | The five objects you must keep straight |
| 3 | [guides/quickstart.md](./guides/quickstart.md) | Install → init → dream → review on a sandbox |
| 4 | [guides/first-dream-walkthrough.md](./guides/first-dream-walkthrough.md) | Annotated end-to-end run with expected outputs |
| 5 | [architecture/overview.md](./architecture/overview.md) | How modules fit together |
| 6 | Feature pages under [features/](./features/) | Deep dives per subsystem |
| 7 | [HONESTY.md](./HONESTY.md) | Claim boundaries (read before demos or PRs) |
| 8 | [BACKLOG.md](./BACKLOG.md) | Complete open work list |
| 9 | [CEO_UPDATE_2026-08-09.md](./CEO_UPDATE_2026-08-09.md) | Latest human brief |
| 10 | [LESSONS_2026-08-09.md](./LESSONS_2026-08-09.md) | Lessons L1–L14 to retain |

---

## Documentation map

```text
docs/
├── README.md                 ← you are here (hub)
├── START-HERE.md             ← product orientation
├── HONESTY.md                ← claim boundaries
├── glossary.md               ← vocabulary
│
├── concepts/                 ← durable ideas (read before features)
│   ├── mental-model.md
│   ├── store-layout.md
│   ├── cas-and-hashing.md
│   ├── canonical-vs-operational.md
│   └── hitl-dreaming.md
│
├── architecture/             ← system shape
│   ├── overview.md
│   ├── module-map.md
│   ├── data-flow.md
│   └── security-model.md
│
├── features/                 ← how each subsystem works
│   ├── memory-store.md
│   ├── secrets.md
│   ├── memory-index.md
│   ├── config-and-tiers.md
│   ├── corpus-importers.md
│   ├── dream.md
│   ├── review.md
│   ├── installer-adapters.md
│   ├── doctor.md
│   ├── portability.md
│   └── mcp.md
│
├── guides/                   ← task-oriented how-tos
│   ├── quickstart.md
│   ├── first-dream-walkthrough.md
│   ├── troubleshooting.md
│   └── contributing-tests.md
│
├── reference/                ← lookup tables
│   ├── cli.md
│   ├── config-schema.md
│   ├── proposal-schema.md
│   └── error-catalog.md
│
├── adapters/                 ← harness / transcript contracts
│   ├── harness-matrix.md
│   └── transcript-formats.md
│
└── superpowers/              ← design/plan/audit history (not the operator guide)
    ├── plans/
    ├── specs/
    └── audits/
```

---

## By role

### Junior analyst / new contributor
1. [START-HERE.md](./START-HERE.md)
2. [glossary.md](./glossary.md)
3. [concepts/mental-model.md](./concepts/mental-model.md)
4. [guides/quickstart.md](./guides/quickstart.md)
5. [architecture/module-map.md](./architecture/module-map.md)

### Operator installing for a team
1. [guides/quickstart.md](./guides/quickstart.md)
2. [features/installer-adapters.md](./features/installer-adapters.md)
3. [adapters/harness-matrix.md](./adapters/harness-matrix.md)
4. [HONESTY.md](./HONESTY.md)
5. [guides/troubleshooting.md](./guides/troubleshooting.md)

### Someone debugging a failed accept / CAS error
1. [reference/error-catalog.md](./reference/error-catalog.md)
2. [features/review.md](./features/review.md)
3. [concepts/cas-and-hashing.md](./concepts/cas-and-hashing.md)
4. [features/doctor.md](./features/doctor.md)

### Someone extending corpus / adapters
1. [features/corpus-importers.md](./features/corpus-importers.md)
2. [adapters/transcript-formats.md](./adapters/transcript-formats.md)
3. [guides/contributing-tests.md](./guides/contributing-tests.md)

---

## Design history (not day-to-day ops)

These are the approved plan, design, and audit trail that produced the package:

- [Design spec](./superpowers/specs/2026-08-08-gotcontext-memory-multi-harness-design.md)
- [Implementation plan](./superpowers/plans/2026-08-08-gotcontext-memory-multi-harness.md)
- [Latest Codex PASS audit](./superpowers/audits/codex_impl_audit_20260808_171008/REPORT.md)
- `thinktank_*` folders / questions — council artifacts from architecture selection

Prefer the feature docs over the plan when they disagree with older prose — the
code + these guides are the living contract; the plan is historical intent.

---

## Package version

Current package version: **0.9.0** (see root `package.json` and [HONESTY.md](./HONESTY.md)).
