# M96 — Broadphase/Narrowphase Coherence

## Canonical contract

M96 introduces explicit coherence state between broadphase candidates, narrow-phase state and persistent-contact identity.

A collision pair has a stable unordered identity. Geometry/position changes are represented by a deterministic AABB signature. Narrow-phase state is discarded when its pair disappears from the current candidate set or when explicitly invalidated.

`fisica.coerencia_colisao` reconciles the current candidate graph with cached narrow-phase state. `fisica.invalidar_colisao` clears narrow-phase state. `fisica.estado_colisao` exposes the reconciled state and current candidates.

M86/M88 remain authoritative for confirming physical collision; M96 only governs state coherence and invalidation.

## Acceptance

- stable pair identity;
- obsolete pair state removed;
- explicit invalidation;
- deterministic reconciliation;
- observable/serializable state;
- M88–M95 compatibility;
- no external engine dependency.
