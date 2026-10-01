# M81 — Transform and Spatial State Model

## Canonical contract

Spatial state is logical runtime state. Entities may have position `{x,y}`, rotation in degrees, and scale `{x,y}`. Position is absolute; movement is a deterministic delta. Rotation and scale are explicit state operations.

Semantics:
- `espaco.posicao`
- `espaco.movimento`
- `espaco.rotacao`
- `espaco.escala`

## Vertical proof

`position (10,20) → move (+5,+3) → (15,23) → rotation 90 → scale (2,2)`.

## Acceptance

- PT-BR/English operation aliases converge to canonical semantics.
- IR validates required spatial parameters.
- RuntimeMemoria exposes position, rotation and scale.
- Movement is deterministic.
- M80 active/inactive state remains independent from transform state.
- No renderer or engine-specific physics API enters the core.
