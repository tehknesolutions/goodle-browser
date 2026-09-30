# Goodle — HNK Ecosystem Integration Baseline V0.1

Status: IMPLEMENTATION BASELINE
Date: 2026-09-29

## Authority boundary

Goodle integrates with, but does not absorb, the HNK ecosystem.

- CODEX-HNK: HNK root canon and canonical knowledge/contract authority.
- HNK-KODE: HNK language/domain contracts.
- haKodan: computational framework, HNK-IR, lowering, runtime and manifestation infrastructure.
- HNK-VERSE: manifestation/world runtime consumer.
- TKN-OS / Tehkné-OS: institutional technology memory, evidence, provenance, registries and know-how.
- GIP / TKN Intelligence: controlled creation, orchestration, validation and human-gate process.
- Goodle: creator-facing implementation/authoring environment and Goodle source of truth for its own implementation.

Integration means shared contracts and explicit projections, never silent authority transfer.

## Canonical creation chain

IDENTITY
→ PROJECT CONTEXT
→ INTENT
→ AUTHORITY / DECISION
→ EXECUTION PLAN
→ CAPABILITY REQUEST
→ PERMISSION
→ EXECUTION
→ EVENT
→ ARTIFACT
→ EVIDENCE
→ PROVENANCE
→ MEMORY

For language/creation:

ALEF / INTENT
→ NARRATIVE
→ VISUAL / BLOCK / GLYPH
→ HNK-KODE
→ AST
→ HOM
→ HNK-IR
→ LOWERING
→ TARGET / RUNTIME
→ MANIFESTATION

## Semantic law

Surface language never owns semantics.

HNK → PT-BR → EN are language profiles over semantic identity. Goodle's Semantic Dictionary and HNK-KODE Semantic Token Registry must converge on semantic IDs.

Unknown HNK vocabulary remains UNRESOLVED. No invented HNK lexeme is permitted.

## Authority states

Goodle must preserve source/authority classification:

OBSERVED
DERIVED
HYPOTHESIS
CANDIDATE
VALIDATED
CANONICAL
UNRESOLVED
DISCOVERY_NON_CANONICAL

For Codex research, additionally preserve:

CORE
REFERENCE
CANDIDATE
RESEARCH_ONLY
EXCLUDE_OPERATIONALLY

No state promotion happens automatically.

## Provenance law

SOURCE != CLAIM != EVIDENCE != DECISION != CANON
CODE != EXECUTION
COMPILED != APPROVED
RUNTIME EVENT != CANON
PROJECTION != AUTHORITY

Every imported HNK/Tehkné contract should retain repository, ref/version, source path when available, authority state and transformation lineage.

## Intent/Event law

INTENT != PLAN != EXECUTION != EVENT.

Intent describes WHAT/WHY and constraints. Plan describes HOW. Event describes WHAT ACTUALLY OCCURRED.

An event does not prove fulfillment. A plan does not prove execution. An execution does not become canon merely because it succeeded.

## Capability law

NO GRANT -> NO CAPABILITY.

Capability is separate from identity, role and intent.

Protected operations must pass an explicit capability evaluation. Unknown security-relevant inputs fail closed.

Capabilities are scoped, revocable, auditable and attributable.

## Runtime law

The principal, agent and runtime/service are distinct identities.

A runtime provider never becomes the logical principal merely because it executes the operation.

A retry creates new execution/event records; it does not rewrite failure history.

Local caches and Studio projections are not institutional memory or canon.

## MHCM law

MHCM is a typed computational projection around HNK-IR.

Cell, Address, Edge, Path, Glyph, Transform, Composition, Type and Operator must be versioned, typed and provenance-preserving.

Geometry does not automatically create semantics. Visual equivalence does not automatically imply computational identity.

Lossy transformations must be marked lossy.

## Manifestation law

HNK-IR remains target-independent.

React, Phaser, Web, App, Game, Canvas, WASM, native and HNK-VERSE are targets/adapters/manifestations.

A target cannot redefine HNK semantics.

## Goodle product consequence

GoodStudio should evolve toward:

Intent
→ Semantic Graph
→ Node/Relation authoring
→ Inspector
→ Goodle IR
→ HNK-KODE/haKodan bridge
→ Manifestation Plan
→ Preview/Runtime
→ Event/Artifact/Evidence/Provenance view.

The same semantic object should be able to project as text, node, block, glyph, IR and target artifact without creating parallel semantic identities.

## Implementation order

P0:
- semantic identity;
- provenance;
- authority states;
- identity/project context;
- intent/event;
- capability boundary.

P1:
- canonical Goodle IR;
- HNK-KODE Semantic Bridge;
- HNK canonical registry subset;
- MHCM typed projection;
- manifestation graph.

P2:
- parser/language profiles;
- HOM projection;
- source maps/lineage;
- target adapters;
- runtime event/artifact evidence integration.

P3:
- Studio graph authoring;
- HNK-KODE visual/standard/pro authoring modes;
- HNK-VERSE consumer path;
- Codex/TKN-OS research projections.

## Non-goals

Goodle does not:
- duplicate complete HNK-KODE repositories;
- become CODEX-HNK;
- become TKN-OS;
- replace HNK-VERSE;
- promote research to canon;
- invent HNK vocabulary;
- infer truth from evidence coverage;
- treat geometry as semantics without explicit contracts.
