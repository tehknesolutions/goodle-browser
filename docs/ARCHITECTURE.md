# Goodle System Architecture

## High-level architecture

GOODLE
├── Good Browser / Studio
├── GAIC Orchestrator
├── GoodProject Model
├── OldRewrite
├── OldTable
├── GoodEngine
├── GoodRuntime
├── Capability Broker
├── Event & Artifact System
├── Provenance
├── Durable Persistence
└── HEPGA Packaging

## Runtime flow

User Intent
→ Intent Model
→ Project Model
→ Execution Plan
→ Capability checks
→ OldRewrite / OldTable generation
→ GoodEngine
→ GoodRuntime
→ Events / Artifacts
→ Validation
→ Versioned project state
→ HEPGA package

## Separation of responsibilities

Good Browser: user-facing environment.

Good Studio: creation and inspection interface.

GAIC: understands intent, creates plans, coordinates specialized agents and repair loops.

GoodProject: canonical project state model.

OldRewrite: describes entities, behavior and executable intent.

OldTable: describes world rules, constraints and declarative laws.

GoodEngine: interprets/compiles project models.

GoodRuntime: executes the resulting experience.

Capability Broker: controls privileged operations.

Event system: records meaningful state transitions.

Artifact system: stores generated outputs.

Provenance: records why an artifact exists and what produced it.

## Architectural rule

No single AI component should be both unrestricted planner and unrestricted executor.
