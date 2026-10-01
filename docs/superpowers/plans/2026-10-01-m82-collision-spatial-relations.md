# M82 — Collision and Spatial Relation Model

## Canonical contract

Spatial relations are pure queries over M81 transform state. They do not mutate entities and do not depend on renderer or physics engines.

Minimum geometry for this slice:
- collision / overlap / inside: Euclidean distance `<= 1`;
- outside: distance `> 1`;
- near: distance `<= 5`;
- distance: Euclidean `sqrt(dx² + dy²)`.

The thresholds are core-contract defaults for M82 and can later be replaced by explicit shape/radius data in a future geometry slice.

## Example

```text
se heroi colidir moeda:
  aumentar pontos de heroi em 1
```

## Acceptance

- PT-BR/English spatial relation aliases converge to canonical relation IDs.
- IR distinguishes spatial conditions from property comparisons.
- RuntimeMemoria calculates deterministic distance and relations.
- Spatial queries do not mutate state.
- Unknown relations remain diagnosable.
- M81 transforms and M80 entity state remain compatible.
