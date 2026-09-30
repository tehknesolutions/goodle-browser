# GOODLE — RESUMO MESTRE DO PROJETO

**Snapshot:** 2026-09-29
**Branch de trabalho:** `feat/goodle-behavior-events-v1`
**Base do PR:** `feat/goodle-ir-v1`
**PR:** #36 — Goodle Behavior/Event Model V1
**Estado:** implementação completa do plano Behavior/Event V1; certificação CI pendente.

## 1. Visão do produto

Goodle é uma camada de criação PT-BR-first que transforma intenção humana em experiências digitais complexas por composição. O objetivo não é reproduzir uma engine específica, mas criar uma linguagem/modelo universal capaz de convergir intenção, low-code, block-code e vibecoding para uma representação intermediária comum.

Princípio:

`Intenção → Componentes → Composição → Regras → Eventos → Runtime → Experiência`

A complexidade deve surgir da composição de elementos simples.

## 2. Bases integradas

A arquitetura considera uma família de referências:

- React — interface e aplicações.
- Phaser — jogos e experiências 2D.
- Godot-like — cenas, nodes, signals, recursos, hierarquia, física, navegação e ciclo.
- BYOND-like — atoms, mob/obj/turf/area/world, proc/verb, cliente, persistência e servidor.
- RPG Maker-like — mapas, eventos, event pages, common events, switches, variables, comandos narrativos e transições.
- Backend/TypeScript — funções, rotas, persistência, estruturas e interoperabilidade.

Essas bases são **fontes de equivalência semântica**, não uma afirmação de que suas APIs ou linguagens sejam tecnicamente idênticas.

## 3. Modelo universal

O Goodle IR é a representação intermediária única.

Fluxo:

`OldRewrite / Block-code / Low-code / Vibecoding / GAIC`
→ Parser/Semantic Bridge
→ **Goodle IR**
→ HyperKernel
→ RuntimeGoodle
→ experiência.

Block-code, low-code, OldRewrite e geração assistida devem convergir para o mesmo IR; não existem IRs paralelos por engine.

## 4. Sintaxe e semântica

Goodle é PT-BR first, mas permite inglês e mistura quando a equivalência está declarada.

Exemplo canônico:

```
criar personagem heroi
criar personagem inimigo
definir vida de heroi como 100
quando heroi tocar inimigo:
  diminuir vida de heroi em 10
```

Equivalente inglês:

```
when heroi touches inimigo:
  decrease vida of heroi by 10
```

Forma mista também é aceita quando cada termo possui equivalência semântica registrada.

O Semantic Dictionary preserva:
- ID canônico;
- termo PT-BR;
- termo original;
- origem/família;
- nível de equivalência;
- necessidade de contexto/origem.

Níveis usados: `direta`, `aproximada`, `contextual`, `com_perda`.

## 5. Behavior/Event Model V1

Modelo:

`EVENTO → QUANDO → [SE] → AÇÃO`

Um comportamento é uma composição de um gatilho e uma ou mais ações filhas.

IDs principais deste marco:

- `comportamento.reacao.quando`
- `evento.toque`
- `dados.valor.definir`
- `dados.valor.diminuir`

A validação rejeita comportamento reativo sem ação e parâmetros obrigatórios ausentes.

## 6. Runtime

RuntimeMemoria agora possui:

- entidades com propriedades numéricas;
- registro de comportamentos;
- emissão de eventos;
- execução de ações filhas;
- cópia defensiva de estado;
- diagnósticos de entidade inexistente, propriedade inexistente e evento desconhecido.

Resultado esperado do vertical slice:

`vida = 100 → evento.toque → diminuir 10 → vida = 90`

## 7. HyperKernel

O HyperKernel permanece independente das engines.

Ele:
1. valida o Goodle IR;
2. verifica capacidade do runtime;
3. usa `registrar()` quando o runtime oferece registro de comportamento;
4. não faz fallback silencioso;
5. retorna `nao_suportado` quando a capacidade não existe.

Não há imports de Phaser, Godot, BYOND ou RPG Maker no núcleo dessa arquitetura.

## 8. Testes

A esteira Behavior/Event V1 possui testes para:

- Semantic Dictionary;
- parser PT-BR/EN/misto;
- validação IR;
- RuntimeMemoria;
- HyperKernel;
- prova E2E.

E2E:

`OldRewrite → IR → validação → HyperKernel → RuntimeMemoria → emitir toque → vida 90`

## 9. Estado de CI

O commit E2E atual `1305925abeb1030b9fa334d170704fde3b3c7f08` recebeu execução real no GitHub Actions.

Runs observados:
- CI Goodle #21 — failure.
- Diagnóstico Runner Goodle #9 — failure.

O job existe, porém a API retorna `steps: null` e a recuperação de logs respondeu `BlobNotFound`. Portanto não há evidência suficiente para atribuir a falha ao código Goodle.

**Regra:** implementação não é marcada como GREEN sem execução verificável de `test + check + build`.

## 10. PR e promoção

PR #36:

`feat/goodle-behavior-events-v1 → feat/goodle-ir-v1`

Estado: **Draft / implementação completa / não certificada**.

Não fazer merge nem declarar GREEN até existir evidência verificável do gate.

## 11. Próximos marcos

1. Corrigir/diagnosticar a infraestrutura do GitHub Actions.
2. Executar `npm test`, `npm run check` e `npm run build` remotamente.
3. Corrigir falhas reais encontradas.
4. Promover Behavior/Event V1 após evidência GREEN.
5. Depois expandir o modelo universal para condições, mais eventos, ações, física, estado, cenas, input, temporizadores e adaptadores concretos.

## 12. Regra de arquitetura

**Equivalência semântica ≠ equivalência técnica.**

O Goodle absorve conceitos de múltiplas engines e linguagens através de um vocabulário e IR comuns, preservando origem, contexto e perdas de equivalência quando existirem.
