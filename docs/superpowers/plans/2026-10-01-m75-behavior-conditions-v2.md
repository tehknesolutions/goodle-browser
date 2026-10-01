# M75 — Behavior/Event Model V2: Conditions

## Goal
Expand the implemented Behavior/Event Model V1 with explicit conditional execution while preserving one Goodle IR and an engine-agnostic HyperKernel.

## Canonical vertical slice

```text
criar personagem heroi
criar personagem inimigo
definir vida de heroi como 100
quando heroi tocar inimigo:
  se vida de heroi maior que 0:
    diminuir vida de heroi em 10
```

Expected:
`100 → toque → condição vida > 0 → diminuir 10 → 90`.

A second proof must set `vida = 0` and confirm the action is not executed.

## Architectural rules

- Conditions are explicit Goodle IR nodes.
- `logica.condicao.se` is the canonical conditional node.
- Comparison operator and operands are explicit parameters.
- Parser only constructs IR; it does not evaluate conditions.
- HyperKernel validates/capability-dispatches; it does not know engine APIs.
- RuntimeMemoria evaluates conditions against runtime state.
- Missing properties/entities produce explicit diagnostics.
- Unsupported runtime capability returns `nao_suportado`.
- PT-BR, EN and mixed syntax converge to the same semantic tree where equivalence is declared.
- No Phaser/Godot/BYOND/RPG Maker imports in parser or HyperKernel.

## Proposed IR shape

```json
{
  "semantica": "logica.condicao.se",
  "familia": "comportamento",
  "parametros": {
    "entidade": "heroi",
    "propriedade": "vida",
    "operador": "maior_que",
    "valor": 0
  },
  "filhos": [
    {
      "semantica": "dados.valor.diminuir",
      "familia": "comportamento",
      "parametros": {
        "entidade": "heroi",
        "propriedade": "vida",
        "valor": 10
      }
    }
  ]
}
```

## Work sequence

### 1. Semantic Dictionary
Add explicit comparison vocabulary and aliases without conflating engine-specific constructs.

Minimum canonical operators:
- `maior_que` / `greater_than`
- `menor_que` / `less_than`
- `igual` / `equals`

### 2. Parser
Parse a `se/if` indented child beneath a `quando/when` block. Parse its indented action children recursively to the next block level.

Required forms:
- PT-BR
- English
- mixed

No evaluation in parser.

### 3. IR validation
Require:
- entity
- property
- operator
- value
- at least one child action

Reject incomplete conditions with explicit diagnostics.

### 4. RuntimeMemoria
Evaluate the condition against numeric entity properties.

Required outcomes:
- condition true → execute children;
- condition false → zero child actions;
- entity missing → `entidade_nao_encontrada`;
- property missing → `propriedade_nao_encontrada`;
- unsupported operator → explicit unsupported result.

### 5. HyperKernel
Preserve the optional capability contract. Do not introduce engine knowledge.

### 6. E2E
Prove both branches:
- `vida=100` → `vida=90`;
- `vida=0` → `vida=0`.

### 7. Independent gate
Run:
```text
npm test
npm run check
npm run build
```

If hosted Actions still fails before steps, record CI BLOCKED separately and retain independent GREEN evidence.

## Non-goals
- real physics;
- collision detection;
- timers;
- scene system;
- multiplayer;
- LLM/GAIC inference;
- concrete Phaser/Godot/BYOND/RPG Maker adapters.
