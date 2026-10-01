# M80 — World and Entity State Model

## Canonical contract

Entity state is logical runtime state. Entities expose an explicit `ativo` flag. Spawn creates/registers an entity; despawn removes it. Activate/deactivate change only logical activity. Scene transitions do not destroy entities in this slice.

Semantics:
- `entidade.ativar`
- `entidade.desativar`
- `entidade.spawn`
- `entidade.despawn`

## Vertical proof

`hero → deactivate → active=false → activate → active=true`.

`spawn enemy → despawn enemy → entity absent`.

## Acceptance

- PT-BR/English operation aliases.
- IR requires operation target.
- Runtime state is observable.
- Spawn/despawn are deterministic.
- Scene transition preserves logical entities.
- No rendering or engine API enters the core.
