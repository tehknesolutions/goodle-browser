# M76 — Behavior/Event Model V3: lifecycle events and state actions

## Canonical slice

```text
criar personagem heroi
definir vida de heroi como 100
quando iniciar:
  aumentar vida de heroi em 10
quando atualizar:
  se vida de heroi maior que 100:
    definir vida de heroi como 100
```

## Semantic contract

- `evento.iniciar`: lifecycle start event, no source/target required.
- `evento.atualizar`: lifecycle update event, no source/target required.
- `evento.toque`: interaction event; source and target remain required.
- `dados.valor.aumentar`: increment an existing numeric property.
- M75 conditional nodes remain composable children of any registered behavior.

## Architecture

`OldRewrite → Goodle IR → validarGoodleIR → HyperKernel → RuntimeMemoria`

Lifecycle events remain engine-agnostic. No Phaser/Godot/BYOND/RPG Maker imports are introduced.

## Acceptance

- PT-BR and English lifecycle syntax converge to the same event IDs.
- lifecycle behaviors validate without source/target.
- touch behavior still requires source/target.
- RuntimeMemoria emits start/update events.
- increase action mutates existing numeric state.
- M75 conditions can guard lifecycle actions.
- unknown events remain explicit `evento_desconhecido`.
