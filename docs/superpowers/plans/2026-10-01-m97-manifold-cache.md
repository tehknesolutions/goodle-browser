# M97 — Collision Manifold Cache

## Canonical contract

M97 persists confirmed narrow-phase manifold data by stable unordered pair identity.

Each cached manifold carries the AABB-derived pair signature at the time it was confirmed. Reconciliation removes manifolds whose pair is no longer a current broadphase candidate or whose geometry/position signature changed.

M97 does not replace M86/M88 as the authority for physical collision confirmation. The cache is populated from confirmed solver results and exposed for coherent reuse/inspection.

## Acceptance

- confirmed contacts create manifold cache entries;
- stable pair identity and deterministic ordering;
- stale geometry/position invalidates affected manifolds;
- disappeared pairs are removed;
- M96 invalidation clears manifold state;
- state is observable/serializable;
- no external engine dependency.
