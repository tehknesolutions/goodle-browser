# M99 — Sequential Impulse Solver State

## Canonical contract

M99 formalizes solver contact state independently from collision detection. Each coherent contact pair has a stable identity, geometry signature, iteration count, normal/tangential accumulated impulse and penetration snapshot.

`fisica.solver.estado` reconciles and exposes state. `fisica.solver.iterar` performs one deterministic solver pass through current candidates and records confirmed contact state. `fisica.solver.aplicar` reapplies the stored state in stable pair order.

M98 warm-start state remains the source of reusable previous-contact impulses. M96/M97 remain responsible for coherence and invalidation. M86/M88 remain authoritative for collision confirmation.

## Acceptance

- empty first solve has no fabricated state;
- confirmed contacts create stable solver state;
- repeated iterations increment state deterministically;
- stale/disappeared pairs are removed;
- invalidation clears solver state;
- no NaN/Infinity state is introduced;
- state is observable/serializable;
- no external physics engine.
