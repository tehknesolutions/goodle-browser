# M95 — Broadphase Pair Cache

## Canonical contract

M95 caches the candidate pair set derived from M94's persistent spatial proxies.

The cache is keyed by a deterministic signature of all current proxy AABBs. If the signature is unchanged, the existing ordered pair set is reused. Position/geometry changes invalidate the cache through proxy updates; explicit rebuild also clears it.

The cached set remains only a broadphase candidate set. M86/M88 narrow phase remains authoritative for collision confirmation.

## Acceptance

- repeated query reuses unchanged cache;
- movement/geometry changes invalidate cache;
- removed entities cannot remain in cached pairs;
- pairs are unique and stable;
- state is observable/serializable;
- explicit rebuild remains equivalent;
- no external engine dependency.
