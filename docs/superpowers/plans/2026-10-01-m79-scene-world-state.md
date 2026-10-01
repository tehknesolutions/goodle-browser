# M79 — Scene and World State Model

## Canonical contract

Scenes are logical runtime state. The core registers scene names and keeps one current scene. A transition is an explicit IR action with a destination; real rendering, scene loading and engine APIs remain adapter responsibilities.

Semantics:
- `estrutura.cena`
- `cena.transicao`
- `cena.entrada`
- `cena.saida`

## Vertical proof

`menu + jogo → iniciar → transicionar para jogo → cena atual = jogo`.

## Acceptance

- PT-BR parser creates scenes and transitions.
- IR requires scene name and transition destination.
- RuntimeMemoria exposes registered scenes and current scene.
- Transition to a registered scene is deterministic.
- Missing destination is explicit and does not silently change state.
- M75–M78 behavior/event model remains engine-agnostic.
