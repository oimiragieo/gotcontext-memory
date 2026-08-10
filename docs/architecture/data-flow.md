# Data flow

**Related:** [HITL dreaming](../concepts/hitl-dreaming.md) · [portability](../features/portability.md)

---

## Init

```text
gcm init [--project]
   │
   ├─► MemoryStore.initStore(root)
   │      mkdir memory/proposals/revisions/receipts/locks
   │      write MEMORY.md + config.json if missing
   │
   ├─► installFragments({ storeHint, home, cwd })
   │      for each detected adapter:
   │        upsert managed block into external instruction file
   │        record preImageBase64 + blockHash
   │
   └─► store.commitOperational(installer-manifest.json)
          assert memoryTreeHash unchanged
```

---

## Dream

```text
gcm dream --source <name> --store <tier> [--force] [--max-sessions 400]
   │
   ├─► openStore; refuse if !dream.enabled && !--force
   ├─► for each selected source:
   │      digestRoots({ roots: defaultCorpusRoots(name), maxSessions, projectKey? })
   │         stream *.jsonl → ~1 KB SessionDigest[]
   │         truncated (byte ceiling) counted separately from malformed
   │         newest maxSessions by session clock
   │
   └─► runDreamFromDigests(store, digests, counts)
          prefs + minePrevalence (≥2 sessions)
          claimKey suppress from proposals/rejected/
          secret filter → commitOperational(proposals/<id>.json)*
          assert memoryTreeHash stable
```

Note: digest path is `*.jsonl` only — Cursor `.vscdb` not consulted (BL-DRM-016).

---

## Accept

```text
gcm review accept <id> --yes
   │
   ├─► assertProposalId(id)
   ├─► load proposals/<id>.json
   ├─► regenerateIndex(overlay) → indexBytes
   ├─► preflight: secrets(target) + checkIndexCaps(index) + secrets(index)
   │
   └─► withCanonicalLocks([target, MEMORY.md])
          commit target | expire | delete
          try commit MEMORY.md
          catch → rollback target → rethrow
       commitOperational(accepted + receipt)
       removeOperational(pending)
```

---

## Export / import

```text
export --out /abs/out.gcm.gz
   walk memory + revisions + proposals + MEMORY.md + config.json
   gzip JSONL lines { path, contentBase64 }
   refuse if out is inside store root

import --from /abs/in.gcm.gz --merge|--replace
   if replace: deleteCanonical memory files absent from archive
   for each row: commitCanonical or commitOperational
   regenerate + commit MEMORY.md
   write receipts/import-<ts>.json
```

---

## Doctor (read-only)

```text
gcm doctor
   snapshot memoryTreeHash
   run checks (config, scanner self-test, memories, dangling index,
               caps, PARTIAL corpus labels, error receipts)
   assert hash unchanged
   exit 1 if report.ok === false
```

Next → [security-model.md](./security-model.md)
