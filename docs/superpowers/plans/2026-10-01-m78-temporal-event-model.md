# M78 — Timer and Temporal Event Model

## Canonical contract

OldRewrite expresses time as abstract behavior events. Goodle IR stores canonical event semantics plus `duracaoMs`. RuntimeMemoria dispatches these events deterministically from an explicit payload; real clocks remain adapter concerns.

Events:
- `evento.temporizador.disparar`
- `evento.tempo.esperar`
- `evento.tempo.intervalo`

## Acceptance

- PT-BR parser support for timer, wait and interval.
- English aliases remain available.
- Duration is explicit in milliseconds.
- Runtime dispatch is deterministic.
- Unknown temporal events return `evento_desconhecido`.
- M76/M77 remain engine-agnostic and compatible.
