# M88 — Physics Contact Manifold and Continuous Collision

## Canonical contract

M88 extends collision state into deterministic contact manifolds and adds continuous circle-circle collision detection.

Contact manifold fields:
- subject/object;
- normalized separation normal;
- penetration depth;
- deterministic contact points;
- relative velocity.

CCD for circles solves the relative-motion quadratic and returns `toi` in `[0, dt]`. Existing overlap returns `toi = 0`.

Contacts are sorted deterministically by subject, object and TOI. Rectangle contacts remain on M86's discrete path.

CCD is opt-in through `colisao continua`; M87 behavior remains unchanged when CCD is not enabled.

## Acceptance

- stable serializable contacts;
- circle-circle TOI;
- high-speed tunneling detection;
- deterministic ordering;
- M87 compatibility;
- no external engine dependency.
