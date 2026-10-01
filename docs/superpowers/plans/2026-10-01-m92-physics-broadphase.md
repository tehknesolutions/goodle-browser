# M92 — Physics Broadphase and Spatial Partitioning

## Canonical contract

M92 adds a deterministic uniform spatial-grid broadphase over explicit M83 geometry.

AABB derivation:
- point: zero-size bounds at its position;
- circle: center ± radius;
- rectangle: center ± half width/height.

The broadphase uses a fixed logical cell size of `4`. Entities are inserted into every overlapped cell. Candidate pairs are deduplicated, AABB-filtered and sorted by stable entity names.

The broadphase only produces candidates. M86/M88 narrow phase remains responsible for confirming physical contact.

## Acceptance

- correct AABBs;
- relevant candidates found;
- distant pairs filtered;
- no duplicate candidates;
- deterministic ordering;
- serializable diagnostics;
- engine-independent core.
