# Plano de Implementação — GoodStudio Mockup

**Spec:** `docs/superpowers/specs/2026-09-29-goodstudio-mockup-design.md`

## Objetivo

Construir uma fatia vertical demonstrável do GoodStudio provando que Vibe-coding, Low-code, Block-code e OldRewrite operam sobre o mesmo GoodProject, com preview React + Phaser e capacidades de Backend representadas no mesmo projeto.

## Restrições globais

- PT-BR first, aceitando PT-BR com acentos, sem acentos, inglês e mistura.
- GoodProject é a fonte estrutural de verdade.
- OldRewrite é a linguagem textual oficial.
- Block-code não possui AST própria.
- TypeScript é manifestação técnica avançada.
- React + Phaser + Backend formam um único tripé interno.
- Inferências são visíveis, editáveis e possuem proveniência.
- TDD em cada fatia implementável.
- Não implementar ainda UltraRender completo, marketplace, multiplayer real, GoodStore ou runtime backend definitivo.

## Task 1 — Shell do GoodStudio

**Produz:** estrutura visual principal e navegação do mockup.

Criar componentes para:
- barra superior;
- navegação lateral;
- área de preview;
- editor central;
- painel Good — THE AI;
- barra de status.

Testes:
- renderiza as áreas principais;
- navegação troca a visão ativa;
- painéis possuem estados recolhíveis sem perder o projeto.

Critério de conclusão: o shell responsivo funciona sem lógica duplicada de projeto.

## Task 2 — Store única do GoodProject

**Produz:** estado compartilhado consumido por todas as visões.

Adicionar operações mínimas:
- criar projeto;
- adicionar/editar componente;
- adicionar/editar dado;
- adicionar/editar fluxo;
- selecionar entidade;
- registrar inferência;
- aplicar lote de alterações.

Testes:
- alteração em uma visão é observável nas demais;
- IDs permanecem estáveis;
- lote é aplicado atomicamente no mockup.

## Task 3 — OldRewrite multilíngue

**Produz:** normalizador + parser sobre a AST existente.

Aliases iniciais:
- quando/when;
- se/if;
- senão/senao/else;
- criar/create;
- mostrar/show;
- abrir/open;
- fechar/close;
- definir/set;
- carregar/load;
- salvar/save.

A tabela de aliases deve ser extensível e separada do parser.

Testes RED→GREEN para:
- PT-BR acentuado;
- PT-BR sem acento;
- inglês;
- expressão mista;
- `se/senão` aninhado;
- erro de indentação;
- preservação da semântica canônica.

## Task 4 — Dados e inferência

**Produz:** modelo de dado com tipo, escopo, persistência, valor e proveniência.

Inferir por padrão quando seguro e reversível; marcar como inferido. Não inventar confirmação para decisões relevantes.

Testes:
- `vida = 100` infere número;
- inferência pode ser sobrescrita manualmente;
- valor manual prevalece sobre inferência;
- proveniência permanece consultável.

## Task 5 — Low-code

**Produz:** árvore de componentes + inspetor de propriedades/dados.

Fluxo demonstrável:
- selecionar Personagem;
- editar Vida;
- alterar persistência;
- refletir imediatamente no GoodProject e OldRewrite/projeções.

Testes de interação para edição e seleção.

## Task 6 — Block-code como projeção

**Produz:** visualização Evento → Condição → Ações/Senão baseada diretamente na AST Goodle.

Não criar armazenamento paralelo de blocos.

Testes:
- AST gera blocos equivalentes;
- edição suportada atualiza AST;
- `se/senão` preserva ramificações;
- mudança reaparece no OldRewrite.

## Task 7 — Preview React + Phaser

**Produz:** preview demonstrável de uma cena Cidade com Personagem e elementos de interface.

React cuida da composição/UI; Phaser manifesta a cena interativa. A separação não aparece como escolha do criador.

Testes:
- preview monta/desmonta corretamente;
- mudanças relevantes no GoodProject atualizam preview;
- erro de manifestação é apresentado em linguagem humana.

## Task 8 — Backend visual

**Produz:** capacidades visuais Usuário, Perfil, Login, Banco, API, Arquivo, Evento, Tarefa, Notificação e Integração.

Nesta fase são modelos/capacidades do GoodProject; não escolher runtime backend definitivo.

Testes:
- adicionar capacidade altera GoodProject;
- relações simples são representáveis;
- permissões não são irrestritas por padrão.

## Task 9 — GAIC mockado / Vibe-coding

**Produz:** fluxo intenção → proposta estruturada → revisar/aplicar.

Caso principal:
`Crie um RPG onde Mig entra numa cidade. Se tiver uma chave abre o portal, senão aparece uma mensagem. Salve moedas e nível.`

Proposta deve incluir componentes, dados, fluxo e persistência. Nada é aplicado antes da ação do usuário no mockup.

Testes:
- proposta não altera projeto antes de aplicar;
- aplicar atualiza GoodProject em lote;
- inferências aparecem marcadas.

## Task 10 — Assets e Segurança

**Produz:** biblioteca mockada de assets e painel de capacidades/permissões.

Testes:
- associação asset→componente;
- permissões começam restritas;
- capacidades concedidas ficam visíveis.

## Task 11 — TypeScript avançado

**Produz:** visão de manifestação TypeScript e estados de round-trip.

Estados:
- representável;
- parcialmente representável;
- código avançado.

Não prometer conversão perfeita de TypeScript arbitrário.

## Task 12 — Fluxo vertical completo

Integrar:

`Intenção → proposta GAIC → GoodProject → Low-code ↔ Block-code ↔ OldRewrite → React/Phaser Preview + Backend visual`

Executar suíte completa, typecheck e build.

Critérios finais:
1. um único projeto em todas as visões;
2. idioma PT-BR/sem acento/EN/mix comprovado;
3. nenhuma AST paralela para Block-code;
4. inferências visíveis;
5. preview funcional;
6. backend integrado conceitualmente;
7. layout utilizável em desktop e adaptável a viewport menor;
8. testes e build verdes antes de integração.

## Ordem de commits sugerida

1. `test/ui: specify GoodStudio shell`
2. `feat/ui: add GoodStudio shell`
3. `test/core: specify shared GoodProject store`
4. `feat/core: add shared GoodProject store`
5. `test(oldrewrite): specify multilingual normalization`
6. `feat(oldrewrite): add multilingual normalization`
7. seguir RED→GREEN por task até integração final.

## Gate final

Não integrar na `main` apenas porque o mockup parece correto. Antes:
- testes completos;
- typecheck;
- build;
- revisão do diff contra a spec;
- correção de problemas importantes;
- só então preparar merge/PR.
