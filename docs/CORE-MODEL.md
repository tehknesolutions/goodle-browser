# GoodProject Core Model

A GoodProject is the canonical structured representation of a Goodle project.

## Core domains

- identity
- intent
- manifest
- systems
- scenes
- entities
- OldRewrite
- OldTable
- assets
- dependencies
- capabilities
- runtime configuration
- tests
- events
- artifacts
- versions
- provenance

## Conceptual object

project = {
  identity,
  intent,
  plan,
  systems,
  scenes,
  entities,
  rules,
  behaviors,
  assets,
  permissions,
  tests,
  runtime,
  history,
  provenance
}

## Invariant

Files are manifestations of the project model, not the only source of truth.

## Versioning

Every accepted state should be addressable by a revision. Concurrent or stale writes must not silently overwrite a newer validated revision.
