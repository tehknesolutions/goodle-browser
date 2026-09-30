# GOODLE DESIGN SYSTEM — V0.1

## 0. Status
Base: Tehkné OS + Tehkné Solutions Site.
Produto: Goodle.
Estado: proposta canônica inicial do Design System.
Regra: identidade Goodle própria, derivada das referências Tehkné sem copiar literalmente a marca institucional.

## 1. Direção de marca
Goodle deve parecer um instrumento de criação, não apenas um editor de código.

A linguagem visual combina:
1. Sistema — precisão, estrutura, grid, tokens e hierarquia.
2. Energia — manifestação visual da intenção em algo executável.
3. Composição — componentes simples formando sistemas complexos.

A referência Tehkné Solutions fornece o eixo tecnológico premium: fundo escuro, superfícies profundas, azul/ciano + violeta, glow controlado, grid e tipografia de alto contraste.

A referência Tehkné OS fornece a disciplina sistêmica: tokens semânticos, ambientes, proveniência, composição e separação entre papel semântico e cor física.

Goodle acrescenta uma assinatura própria: criação universal, linguagem, engines convergentes e transformação de intenção em experiência.

## 2. Princípio visual
GOODLE = INTENÇÃO → COMPOSIÇÃO → MANIFESTAÇÃO

Intenção: texto, comando, prompt, entrada.
Composição: nodes, blocos, componentes, conexões.
Manifestação: preview, cena, jogo, app, experiência.

## 3. Logo
Conceito: símbolo de composição/convergência formado por poucos elementos geométricos.

Núcleo central = intenção.
Nós periféricos = componentes.
Conexões = equivalências/composição.
Forma externa = sistema/runtime.
Abertura/passagem = manifestação.

Evitar mascote genérico, símbolo de código como solução principal, cópia do símbolo Tehkné, excesso de neon e detalhes que desapareçam em tamanhos pequenos.

O símbolo deve funcionar em favicon 16 px, 24, 32, 48, 64, 128 e 512 px, em fundo claro/escuro, monocromático, outline e filled.

Wordmark: GOODLE, caixa alta, tracking moderado, peso 800–900. Subtítulo opcional: UNIVERSAL CREATION ENGINE.

## 4. Paleta inicial
A referência Tehkné Solutions usa fundo escuro, superfícies azul-marinho, ciano #38BDF8, violeta #8B5CF6 e magenta #D946EF. Goodle herda o princípio, mas possui tokens próprios.

Core:
- canvas #050812
- surface #0B1020
- surface-raised #11182A
- surface-sunken #03050B
- text #F8FAFC
- text-secondary #B7C2D6
- text-muted #7F8BA3
- border rgba(148,163,184,.16)

Creation Energy:
- cyan #38BDF8
- violet #8B5CF6
- magenta #D946EF

Estados funcionais são independentes da identidade de marca: success, warning, error e info.

## 5. Gradiente
Gradiente principal: cyan → violet → magenta.

Uso: logo energético, CTA principal, highlights, conexões de nodes, estados de criação e hero/manifestação. Não usar como preenchimento indiscriminado.

## 6. Tipografia
Primária: Inter ou equivalente system sans para UI, documentação, labels e navegação.
Display: Inter/Manrope/Geist-like, peso 800–900 para títulos e hero.
Monoespaçada: JetBrains Mono ou equivalente para Goodle Syntax, Goodle IR, código, IDs semânticos e logs.

## 7. Forma
Herança TKN: controle 8 px, card 12 px, surface 16 px, hero 24 px.
Goodle: node 8–12 px, canvas frame 16–24 px, terminal/code 12 px, connection 1–2 px, focus ring 2–3 px.

## 8. Grid
Base 8, 16, 24, 32, 48 e 64 px.
Grid visual de canvas: 16 px em escala normal, 8 px em zoom alto, 32 px em zoom reduzido. O grid deve desaparecer visualmente quando não for necessário.

## 9. Componentes
Goodle App Shell: top bar, workspace, status e command surface.
Goodle Command Bar: entrada de intenção; surface elevada, borda sutil, glow apenas em foco, monoespaçada para sintaxe.
Goodle Canvas: grid, nodes, connections, minimap, zoom e seleção.
Goodle Node: ícone, nome, tipo, estado e portas. Estados: idle, selected, focused, running, success, warning, error, disabled.
Goodle Connection: linha semântica entre componentes. Tipos: data, event, control, dependency, output.
Goodle Inspector: edição de propriedades.
Goodle Preview: manifestação de app, game, scene, web ou simulation.
Goodle Runtime Status: idle, compiling, running, paused e error.

## 10. Engines
Phaser, Godot, BYOND e RPG Maker não devem dominar a identidade visual. São adapters/capabilities:
- Phaser Adapter
- Godot Adapter
- BYOND Adapter
- RPG Maker Adapter

Cada adapter pode possuir ícone, capability list, status, compatibility e mapping coverage. Goodle permanece como marca principal.

## 11. Ícones
Estilo geométrico, stroke-first, 1.75–2 px, cantos moderadamente arredondados e sem preenchimentos complexos.

Famílias: Creation, Structure, Data, Behavior, Event, Runtime, Engine, AI, Project e Knowledge.

## 12. Motion
Referência Tehkné: movimento premium, brilho controlado e transições rápidas.
Goodle: fast 120–160 ms; base 220–280 ms; complex 360–500 ms.
Motion comunica entrada, conexão, execução, transformação e conclusão. Nunca deve mascarar latência.

## 13. Estados de criação
IDEIA → INTERPRETANDO → COMPONDO → VALIDANDO → EXECUTANDO → MANIFESTADO

Micro-indicadores podem representar cada etapa sem trocar toda a paleta da interface.

## 14. Design tokens
Separação obrigatória:
primitive tokens → semantic tokens → component tokens → product themes

Componentes não devem depender diretamente de cor física quando existir papel semântico.
Exemplo conceitual: button.primary.background → action.primary → creation.energy.

## 15. Temas
V0.1: Goodle Dark como padrão.
Futuros: Goodle Light, Goodle Canvas, Goodle Runtime e Goodle Code.
Tema altera superfície e semântica, não a identidade fundamental.

## 16. Artefatos do logo
Ordem:
1. símbolo mestre
2. wordmark
3. lockup horizontal
4. lockup vertical
5. favicon
6. app icon
7. monochrome
8. dark/light
9. SVG
10. área de proteção
11. tamanhos mínimos
12. usos incorretos

## 17. Regra de ouro
Goodle deve parecer uma ferramenta capaz de criar qualquer coisa, não uma ferramenta especializada em uma única engine.

Identidade: universalidade + precisão + criação + tecnologia + manifestação.
