# Goodle Governance

## Authority model

Human project owner → product decisions.

GAIC → interpretation, planning, orchestration and bounded execution.

Specialists → domain proposals and implementation.

Runtime → executes approved project state.

## Decision states

DECIDED
EXPERIMENTAL
CANON / APPROVED
DEFERRED
REJECTED

## Provenance

Every major generated decision should be traceable to one or more of:

- user intent
- approved requirement
- research/reference
- experiment
- validation evidence
- implementation result

## Capability security

Privileged operations must be mediated by a Capability Broker.

Examples:
- filesystem read/write
- network access
- process execution
- browser automation
- deployment
- secrets access

Capabilities should be scoped to the smallest practical project/resource boundary.

## Change management

Prompt/input → execution → changelog → validation → checkpoint.

A generated change without an evidence trail is not a trusted checkpoint.
