# Feature: Dream

**Code:** `src/dream/run.ts`, `src/dream/policy.ts`  
**Tests:** `test/dream.test.ts`  
**Concept:** [HITL dreaming](../concepts/hitl-dreaming.md)

---

## CLI

```bash
gotcontext-memory dream --source claude|codex|cursor|agy|opencode|all \
  --store user|project \
  --scope user|project \
  --force   # required when dream.enabled is false (default)
```

Prints JSON including `sources: [{name,label,scanned,included,malformed,errors}]`.

On empty kept corpus: stderr `EMPTY_CORPUS — …` and exit code 1.

---

## Pipeline (detailed)

1. **Load config** — policy + allowlist already on store
2. **`applyDreamPolicy`** — excludeSources + focus keywords
3. **Empty check** — throw `EmptyCorpus` if nothing left
4. **`loadStoreHashes`** — map `memory/**/*.md` → current hashes (for `base_hash`)
5. **Extract**
   - Preference regex on user/human turns → `create` proposals
   - Staleness pass → `expire` proposals for old frontmatter timestamps (~90d)
6. **`maxProposals`** — slice; add overflow to `dropped`
7. **Secret filter + `commitOperational`**
8. **Assert `memoryTreeHash` unchanged**

---

## Proposal id stability

`proposalId` hashes: `action`, `targetPath`, `base_hash`, `body`, evidence quotes.
`createdAt` / `expiresAt` are **not** part of the id material.

---

## What dream will not do (v0.9)

- Call an LLM
- Write `memory/` or `MEMORY.md`
- Schedule itself
- Auto-accept

Extraction is intentionally simple (preference phrases + staleness). Richer
lenses (contradictions, supersedes from multi-turn reasoning) are future work;
schema already allows `update|supersede|delete` actions for review.

← [corpus](./corpus-importers.md) · Next → [review.md](./review.md)
