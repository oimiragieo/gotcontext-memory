# First dream walkthrough (annotated)

**Related:** [quickstart](./quickstart.md) · [dream](../features/dream.md) · [review](../features/review.md)

This walkthrough uses the **library API + test fixtures** so it works even when
you have no Claude sessions on the machine. Junior analysts can paste it into a
scratch script under `/tmp`.

**CLI note:** production `gotcontext-memory dream` streams digests and requires
`--force` when `dream.enabled` is false (the install default). This script calls
`runDream` directly on fixtures, so the enabled gate does not apply here.

---

## Setup

```bash
cd /path/to/gotcontext-memory
npm test   # optional confidence: 85 passing
```

Create `/tmp/gcm-walkthrough.mjs` (ESM; package is `"type": "module"`):

```js
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { MemoryStore } from "./dist/store.js";
import { claudeCorpus } from "./dist/corpus/claude.js";
import { runDream } from "./dist/dream/run.js";
import { listProposals, acceptProposal } from "./dist/review.js";

const storeRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-walk-"));
const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "gcm-fix-"));
const proj = path.join(fixtureRoot, "demo-proj");
await mkdir(proj, { recursive: true });
await writeFile(
  path.join(proj, "sess.jsonl"),
  JSON.stringify({
    timestamp: "2026-01-01T00:00:00Z",
    message: {
      role: "user",
      content: "Please remember: always run the test suite before pushing.",
    },
  }) + "\n",
);

const store = await MemoryStore.initStore(storeRoot);
const before = await store.memoryTreeHash();
console.log("1) store ready", storeRoot);
console.log("   memoryTreeHash", before);

const scanned = await claudeCorpus.scan({ scope: "user", roots: [fixtureRoot] });
console.log("2) corpus", {
  scanned: scanned.scanned,
  included: scanned.included,
  label: scanned.label,
});

const { proposals, withheldSecrets, dropped } = await runDream(
  store,
  scanned.transcripts,
  {
    scanned: scanned.scanned,
    included: scanned.included,
    excluded_permission: scanned.excluded_permission,
  },
);
console.log("3) dream", { count: proposals.length, withheldSecrets, dropped });
console.log("   hash unchanged?", (await store.memoryTreeHash()) === before);

console.log("4) pending", await listProposals(store));

const id = proposals[0].id;
await acceptProposal(store, id);
console.log("5) accepted", id);
console.log("   memory file", proposals[0].targetPath);
console.log("   index snippet:\n", (await store.read("MEMORY.md")).toString("utf8"));
```

Run:

```bash
node /tmp/gcm-walkthrough.mjs
# or from repo: node --experimental-vm-modules with path adjust
cd /path/to/gotcontext-memory && node <<'EOF'
# paste script with imports from ./dist/...
EOF
```

Easier: copy the script into the repo as a disposable file and
`node scratch-walkthrough.mjs`.

**Operator CLI equivalent** (after `init`, with live or fixture roots):

```bash
gotcontext-memory dream --source claude --force --max-sessions 400
gotcontext-memory review list
```

---

## What you should observe

| Step | Expected |
|---|---|
| After dream | `proposals.length >= 1`, hash identical to `before` |
| `listProposals` | One pending JSON with `action: "create"` and evidence quote |
| After accept | Pending list empty; `memory/pref-….md` exists; `MEMORY.md` links it |
| Tree hash | Changed vs `before` |

---

## Failure modes to try next

1. Put `AKIAIOSFODNN7EXAMPLE` in the user message → dream withholds (`withheldSecrets`)
2. Accept twice → second accept fails (proposal gone) or CAS if you craft stale base
3. Run `doctor` on the store root via CLI after pointing `--store` appropriately
4. Reject a proposal, re-run dream → same claim suppressed (`claimKey` / `suppressedRejected`)

Next → [troubleshooting.md](./troubleshooting.md)
