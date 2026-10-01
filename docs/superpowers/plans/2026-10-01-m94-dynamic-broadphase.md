# M94 — Dynamic Broadphase Updates

## Canonical contract

M94 turns the M92 spatial grid into persistent runtime state.

Each entity owns a spatial proxy containing its current AABB signature and occupied cells. When the signature is unchanged, the proxy is reused. When position or geometry changes, old cells are removed and new cells are inserted deterministically.

`fisica.broadphase_reconstruir` explicitly clears and rebuilds all proxies. `fisica.broadphase_atualizar` reconciles the persistent state. `fisica.broadphase_estado` exposes sorted cells and proxies for diagnostics.

Collision candidate queries use the persistent grid and retain M92/M93 deduplication and ordering guarantees.

## Acceptance

- movement updates only changed proxies;
- geometry changes invalidate the affected proxy;
- removed entities disappear from the grid;
- explicit rebuild is available;
- incremental and rebuilt candidate results are equivalent;
- grid state is deterministic and serializable;
- no external engine dependency.
