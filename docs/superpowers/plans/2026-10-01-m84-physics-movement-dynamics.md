# M84 — Physics and Movement Dynamics Model

## Canonical contract

M84 adds deterministic, engine-agnostic dynamics to entity state.

Each dynamic entity has:
- velocity `(vx, vy)`;
- acceleration `(ax, ay)`;
- gravity `(gx, gy)`;
- positive mass `m`.

Discrete explicit integration with `dt`:
- `v += (a + g) * dt`
- `p += v * dt`

Impulse:
- `v += impulse / m`

`dt` is always explicit in the core update operation. No real clock is introduced.

## Acceptance

- PT-BR/English parser and canonical semantics;
- IR parameter validation;
- deterministic runtime state;
- positive mass requirement;
- gravity and acceleration integrated with explicit `dt`;
- impulse uses mass;
- M80–M83 remain compatible;
- no renderer or engine physics API in core.
