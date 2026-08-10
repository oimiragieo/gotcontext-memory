# Skill accuracy check — 2026-08-09 (Lane B)

Triple-check of skill/rule claims vs live code. No new skill dirs created.

## Files edited

| Path | Action |
|---|---|
| `.claude/skills/gotcontext-memory-hitl-honesty/SKILL.md` | Fixed + clarified |
| `~/.claude/skills/gotcontext-memory-hitl-honesty/SKILL.md` | Synced identical |
| `~/.claude/skills/transcript-dream-hitl/SKILL.md` | Added digests/prevalence/windowing cross-ref |
| `.cursor/rules/gotcontext-memory.mdc` | Synced load-bearing claims |

## Claim → verified | fixed

| Claim | Status | Live evidence |
|---|---|---|
| Locks = `locks/<sha256(rel)>.lock` | **verified** | `src/store.ts:117` |
| MEMORY.md regenerated under same locks after accept | **verified** | `src/review.ts:176`, `:234–250` |
| `mcp.allowCommit` default false; `memory_commit` gated | **verified** | `src/config.ts:32`, `src/mcp/handlers.ts:57–72`, `:118–127` |
| `memory_read` = MEMORY.md \| memory/** | **verified** | `src/mcp/handlers.ts:10–14`, `:30–31` |
| Preference anchors `please remember` \| `from now on`; deny pong/ping/health | **verified** | `src/dream/digest.ts:56–58`, `src/dream/run.ts:88–92` |
| Stream digests; not whole-file multi-GB | **verified** | `src/dream/digest.ts:7–13`, `:94–95`, `:233–240` |
| Digest enumerates `*.jsonl` only | **verified** | `src/dream/digest.ts:198`, `:213` |
| `claimKey` suppresses **rejected** (`proposals/rejected/`) | **verified** | `src/dream/run.ts:42–43`, `:51–74` |
| Accepted prefs not re-proposed via **store presence** (not claimKey archive) | **fixed** (skill over-claimed “accepted via claimKey”) | `src/dream/run.ts:98–101`, `:275`; `test/dream-suppression.test.ts:53–75` |
| `--max-sessions` default 400 | **verified** | `src/cli.ts:117–120`, `:171` |
| `maxProposals` sorted by evidence length | **verified** | `src/dream/run.ts:298–307`, `:394–408` |
| `dream.enabled` false requires `--force` | **verified** | `src/cli.ts:116`, `:126–131`; default `src/config.ts:29` |
| Doctor caps fail when over; shared `countIndexLines` | **verified** | `src/doctor.ts:8`, `:101–107`; `src/store.ts:48–58` |
| Overlay `deletes: []` not `{}` | **verified** | `src/index.ts:8`, `:28`; `src/review.ts:237` |
| Fake-green skip = EPERM/EACCES only (not ReferenceError) | **fixed** (skill omitted ENOTSUP; live test allows it) | `test/store-extra.test.ts:33` |
| Cursor `.vscdb` gap on digest dream path | **verified** | `src/dream/digest.ts:213` vs `src/corpus/cursor.ts:50–60`; HONESTY.md; BL-DRM-016 |
| Version 0.9.0 until CEO gate | **verified** | `package.json:3` |
| No LLM parity with omega dreams | **verified** | skill table; `transcript-dream-hitl` row |
| Skill trailing `EOF` heredoc artifact | **fixed** | removed from both skill copies |
| Skill “L1–L20” with unmapped 1–15 bullets | **fixed** | bullets now carry L# anchors; L9/L13 pointed to LESSONS |
| transcript-dream-hitl digests/prevalence/windowing cross-ref | **fixed** | added; still states no LLM parity |

## Sync check

```text
cmp repo .claude/skills/.../SKILL.md == ~/.claude/skills/.../SKILL.md → IDENTICAL
```

## Post-integrate note

Parent reconciled companion skills after this audit: `gotcontext-memory-claim-lifecycle`
and honesty bullet 12 now state the **two** suppression mechanisms (rejected=`claimKey`,
accepted prefs=`storeHashes.has(targetPath)`). Lesson **L21** records the retention-lane duty.
Mirrors: `.cursor/skills/` + `~/.claude/skills/`.
