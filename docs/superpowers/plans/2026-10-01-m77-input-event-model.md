# M77 — Input/Event Model

## Canonical contract

OldRewrite expresses abstract input; IR stores a canonical event and its input identifier; RuntimeMemoria consumes an abstract payload.

Events:
- `evento.tecla.pressionar`
- `evento.tecla.soltar`
- `evento.clique`

Payload:
- keyboard: `codigo`
- pointer/click: `alvo`

No engine-specific hardware API is part of the core contract.

## Example

```text
quando pressionar tecla espaco:
  aumentar vida de heroi em 10

quando clicar botao:
  diminuir vida de heroi em 5
```

## Acceptance

- PT-BR/English parser convergence.
- Runtime dispatch by canonical event + abstract identifier.
- Unknown input event remains `evento_desconhecido`.
- M76 lifecycle events continue to work.
- No engine imports.
