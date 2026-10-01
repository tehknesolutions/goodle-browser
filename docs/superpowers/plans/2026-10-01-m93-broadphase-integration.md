# M93 — Broadphase Integration

## Canonical contract

M93 makes M92 an active collision-solver strategy rather than a diagnostic-only capability.

`fisica.broadphase_ativar` enables the deterministic spatial grid. `fisica.broadphase_desativar` restores the all-pairs fallback. `fisica.pares_colisao` reports the candidate strategy currently selected.

When enabled, M86 narrow phase receives only M92 candidates. The fallback remains all-pairs. The physical confirmation contract remains owned by M86/M88.

## Acceptance

- solver uses broadphase when enabled;
- distant bodies are excluded before narrow phase;
- candidate pairs remain deduplicated and stable;
- all-pairs remains available;
- relevant collision semantics remain equivalent;
- strategy state is observable;
- no external engine dependency.
