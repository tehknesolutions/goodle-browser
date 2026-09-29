# OldTable Specification — Proposal v0

## Purpose

OldTable is the declarative world/rules layer of Goodle.

## Model

OldRewrite = how things behave.

OldTable = which rules govern the world.

## Example concepts

- gravity
- time scale
- collision policy
- movement constraints
- resource rules
- scoring rules
- win/loss conditions
- simulation constraints

## Requirements

- explicit rules
- composable rulesets
- inheritance/overrides with traceability
- deterministic evaluation when requested
- validation before runtime activation

## Rule precedence

Project-level rules override defaults only when explicitly declared. Generated overrides must retain provenance.
