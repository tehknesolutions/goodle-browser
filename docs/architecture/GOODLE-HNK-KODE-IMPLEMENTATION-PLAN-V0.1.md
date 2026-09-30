# Goodle HNK-KODE / haKodan Implementation Plan V0.1

## Gate 0 — authority and source lock
Freeze source refs for HNK-KODE, CODEX-HNK, HNK-VERSE and TKN-OS contracts used by Goodle.

## Gate 1 — semantic core
Unify Goodle Semantic Dictionary and HNK-KODE Semantic Token Registry behind semantic IDs.
- HNK/PT-BR/EN profiles converge to one semantic identity.
- Unknown HNK terms remain unresolved.
- equivalence remains explicit.
- provenance remains attached.

## Gate 2 — intent graph
Add IntentEnvelope, ProjectContext and ExecutionPlan as distinct records.
Never compile a plan back into the original Intent.

## Gate 3 — event/provenance
Add typed EventEnvelope, Artifact references and provenance lineage.
Events remain occurrences, not evidence or canon.

## Gate 4 — capability security
Add CapabilityRequest/Grant and Permission Broker boundary.
Default: NO GRANT → NO CAPABILITY.
Security ambiguity fails closed.

## Gate 5 — MHCM projection
Add typed Cell/Address/Edge/Path/Glyph/Transform structures.
MHCM is a projection around HNK-IR, not a second parser/runtime.

## Gate 6 — manifestation graph
Allow one Goodle IR to produce multiple target projections without changing semantic identity.

## Gate 7 — HOM
Add the HNK Object Model projection: identity + state + components + relations + behaviors + events + narrative + assets + presentation + data + manifestations + provenance.

## Gate 8 — Studio
Expose Intent, Semantic Graph, Nodes/Edges, Inspector, provenance, authority, manifestation targets, runtime/events and evidence/review state.

## Gate 9 — HNK-VERSE
Implement a consumer adapter for world/entity/property/event/action.

## Gate 10 — Codex/TKN research
Expose research records as reference/candidate views only. Never silently promote research to canon.

## Definition of done
The same simple creation is representable as PT-BR → Semantic ID → Goodle IR → HNK-KODE/haKodan → manifestation, with provenance and authority preserved end-to-end.
