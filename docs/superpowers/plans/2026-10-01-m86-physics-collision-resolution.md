# M86 — Physics Collision Resolution

## Canonical contract

M86 connects explicit geometry, dynamics, and world constraints into deterministic collision resolution.

Pipeline:
1. detect overlap;
2. compute separation normal and penetration;
3. correct positions using inverse mass;
4. resolve closing normal velocity with restitution;
5. resolve tangential velocity with friction;
6. expose collision diagnostics.

Blocked entities have inverse mass zero and therefore behave as immovable bodies.

Supported narrow phase:
- circle-circle;
- axis-aligned rectangle-rectangle.

## Acceptance

- deterministic collision result;
- observable normal and penetration;
- mass-weighted positional correction;
- restitution impulse;
- friction impulse;
- blocked-body handling;
- no-state-change when there is no collision;
- no external physics engine dependency.
