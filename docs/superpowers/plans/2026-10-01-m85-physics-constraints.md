# M85 — Physics Constraints and World Rules

## Canonical contract

M85 adds deterministic world constraints over M84 dynamics.

Rules:
- world bounds: `xMin/xMax/yMin/yMax`;
- logical surface at `y`;
- friction `>= 0`, applied as `v *= max(0, 1 - friction * dt)`;
- restitution in `[0,1]`;
- blocking freezes velocity and prevents positional integration during rule application.

Boundary/surface response clamps position and reflects the velocity component along the violated normal multiplied by restitution.

Rules are applied explicitly after M84 integration through `fisica.aplicar_regras` with an explicit `dt`.

## Acceptance

- PT-BR/English parser and canonical semantics;
- IR validation of required parameters;
- deterministic surface and boundary correction;
- deterministic friction and restitution;
- explicit blocked state;
- M80–M84 compatibility;
- no engine-specific physics dependency.
