# Goodle / haKodan — Project State — 2026-09-30

## Objetivo desta fase

Fechar a arquitetura de domínio e integração antes da implementação do aplicativo orientado a prompt de comando. A próxima fase não deve reescrever estes contratos; deve consumi-los.

## Pipeline consolidado

`Alef/Intent → OldRewrite/Compiler → Semantic Graph → HOM → HNK-IR → Verse Plan → Dependency Graph → Capability Gate → HNK-VERSE Interop → Runtime → Receipt → Artifact → Evidence → Provenance → Chronicle`

## Autoridades e fronteiras

- Goodle interpreta, compila, valida, orquestra e mantém lineage.
- HNK-VERSE é a autoridade de manifestação/runtime; Goodle não duplica seu motor.
- Goodle HNK-IR não é tratado como representação nativa HNK-VERSE.
- A fronteira usa `TRANSLATE` com mapper versionado.
- Mapping desconhecido permanece `UNRESOLVED`.
- Mapping só pode ser usado pelo mapper quando `VALIDATED`.
- Artifact só nasce de receipt `executed`.
- Evidence de processo não implica verdade factual, causal ou metafísica.
- Chronicle não inventa elos ausentes.

## Componentes implementados no branch

- HOM e HNK-IR.
- HNK-VERSE Plan, relações e Dependency Graph.
- Execution Contract, Capability Gate, Event/Evidence/Provenance.
- Artifact Contract.
- Chronicle/Lineage e Inspector do GoodStudio.
- Manifestation Registry.
- Compiler Contract OldRewrite → Semantic Graph.
- Studio execution preparation/state/controller boundaries.
- HNK-VERSE Interop Adapter.
- `goodle-hnkir-to-hnk-verse/v0.1` mapper.
- Mapping Registry, Validation Gate e Evidence Ledger.

## Mapping v0.1

- `ENTITY / estrutura.entidade → CraftEntity`: `VALIDATED`.
- `WORLD`: `UNRESOLVED`.
- `PROPERTY`: `UNRESOLVED`.
- `EVENT`: `UNRESOLVED`.
- `ACTION`: `UNRESOLVED` salvo futura especialização semântica aprovada.

Não promover mappings por semelhança nominal. Promoção `CANDIDATE → VALIDATED` exige referência do contrato HNK-VERSE, evidência de payload e teste de conformidade.

## Gate de integração

O PR desta fase deve permanecer sem merge enquanto CI não produzir evidência fresca de:

1. `npm ci`
2. `npm run check`
3. `npm test`
4. `npm run build`

O workflow `.github/workflows/ci.yml` foi atualizado para executar os quatro gates. Se o runner falhar antes de iniciar steps, isso é infraestrutura e não evidência de falha ou sucesso do código.

## Próxima fase: Prompt de Comando / CLI

A CLI será a primeira superfície executável principal. Ordem:

1. definir protocolo de comandos e help;
2. criar REPL/CLI sem UI React;
3. ligar comandos ao Compiler Contract e Semantic Graph;
4. expor `compile`, `inspect`, `map`, `execute`, `artifact`, `chronicle`;
5. integrar o adapter HNK-VERSE sem duplicar runtime;
6. criar fixtures e golden tests de sessões completas;
7. somente depois iniciar a aplicação visual React + Phaser consumindo a mesma camada de domínio.

## Regra para React + Phaser

React e Phaser serão adapters/UI sobre os contratos existentes. Nenhuma regra de domínio deve existir apenas em componente React ou cena Phaser se puder viver no núcleo/CLI compartilhado.
