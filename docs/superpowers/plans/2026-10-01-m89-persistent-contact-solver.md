# M89 — Persistent Contact Solver

## Canonical contract

M89 persists M88 contact manifolds across simulation steps through a stable `subject/object` key.

The cache stores normalized normal, penetration and accumulated normal impulse. Contacts that disappear are removed deterministically.

The persistent solver iterates in stable contact order, applies non-negative incremental normal impulse, and treats blocked entities as inverse mass zero.

The iteration cap is inherited from M87.

## Acceptance

- persistent cache is observable and serializable;
- stable contact identity;
- deterministic ordering;
- accumulated normal impulse is non-negative;
- multiple contacts can be iterated;
- vanished contacts are removed;
- M88/M87 compatibility;
- no external engine dependency.
