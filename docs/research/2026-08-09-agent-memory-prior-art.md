# Research memo — agent memory prior art (2026-08-09)

**Freshness path:** WebSearch (Exa MCP unavailable this session — lesson L13).  
**Purpose:** Ground new gotcontext skills in external patterns without pretending we implemented them.

## Sources consulted

| Source | URL | Takeaway for us |
|---|---|---|
| Selective promotion (Broda) | https://medium.com/@ericbroda/best-practices-for-agent-memory-management-b25528dbe9df | Capture → classify → **approve** before durable memory. Matches our HITL propose/accept. |
| Canonical vs derived context (Oracle) | https://blogs.oracle.com/developers/persistent-memory-and-derived-context-a-two-layer-pattern-for-agents | Raw event stream is huge; digests/embeddings are **lossy derived** views. Maps to streaming `SessionDigest`. |
| Conversation compaction / journal | https://jatinbansal.com/ai-engineering/conversation-compaction/ | Bound live buffer; journal for recall. We bound **dream input**, not chat buffer. |
| Pull-model memory (agentmemory) | https://github.com/MukundaKatta/agentmemory | No silent background bake; deletes real. Aligns with propose-only + reject stays rejected. |
| Oblivion (decay activation) | https://arxiv.org/abs/2604.00131 | Memory as control + decay of unused traces. **We do not implement decay weights**; closest shipped analogs are `--max-sessions` windowing + expire proposals + claim suppression. |
| Remember When It Matters | https://arxiv.org/html/2607.08716v1 | Proactive intervene-or-silent policy. **Deferred** — gotcontext has no sidecar advisor. |
| Agent-native memory study (talk) | https://www.youtube.com/watch?v=hRuKwcm1fiA | Late filtering; structured evidence > flat similarity. Our prevalence is string-key evidence, not vectors. |

## Adopted in gotcontext (shipped)

- HITL selective promotion (proposals → human accept)  
- Streaming derived digests over canonical JSONL  
- Windowed prevalence (not all-history)  
- Claim suppression after reject/accept (`claimKey`)  
- Explicit preference anchors (high-precision promotion gate)

## Explicitly deferred

- LLM reviewer / semantic merge across phrasings (BL-DRM-001/002)  
- Decay-driven activation weights (Oblivion)  
- Proactive memory-agent interventions  
- Vector / graph memory maintenance  
- Re-wiring `.vscdb` into digest path (BL-DRM-016 — scheduled, not philosophical defer)

## Skill mapping

| External pattern | Skill |
|---|---|
| Selective / HITL promotion | `gotcontext-memory-hitl-honesty` |
| Canonical → derived digests | `gotcontext-memory-streaming-digests` |
| Lifecycle / suppression / windowing | `gotcontext-memory-claim-lifecycle` |
