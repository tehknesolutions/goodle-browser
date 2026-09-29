# GOODLE — Registro Canônico da Sessão 2026-09-29

> Objetivo: consolidar no repositório oficial as decisões, conceitos, arquitetura, regras, planos e estado de implementação definidos nesta sessão. Este documento complementa o PDD, specs, planos e fontes já existentes.

## 1. Identidade do projeto

- Projeto: **Goodle Browser & Hyper-Engine Ecosystem**.
- Versão conceitual: **2.0 — Reboot**.
- Princípio: **“Você descreve o que quer. O Goodle cria.”**
- Produto principal: navegador/ecossistema digital baseado na GoodEngine.
- Idioma de produto/documentação/UI: **PT-BR first sempre**.

## 2. Ecossistema original

### Goodle Browser
Navegador próprio. O PDD propõe UltraRender como motor futuro independente de Chromium/Blink/Gecko/WebKit. Isso é visão de longo prazo, não requisito do mockup atual.

### GoodEngine
Hyper-Engine para criar sites, apps, jogos, documentos, IA e experiências multidimensionais.

### GAIC
Good AI Creator: criação por intenção em linguagem natural. Exemplo: “Crie um RPG medieval 3D com magia.”

### OldRewrite
Linguagem textual oficial do Goodle, orientada ao criador e não mera versão simplificada de TypeScript.

Níveis propostos:
- ORL Básico;
- ORL Intermediário;
- ORL Alto;
- ORL CC (Ciência da Computação / sistemas avançados).

### OldTable
Sistema de leis/regras do projeto, permitindo leis diferentes por projeto, incluindo gravidade, tempo e outras regras próprias.

### HEPGA
Formato universal `.hepga` para site, app, jogo, experiência interativa ou projeto criado por IA.

### Dimensionalidade
Visão de projetos 1D, 2D, 3D, 4D, 5D e 6D, definida pelo projeto/OldRewrite/OldTable/GAIC.

### GoodStudio
Ambiente integrado de criação. Modos:
- Manual;
- IA;
- Híbrido.

### Good AI
Arquitetura desejada híbrida: processamento local + servidores Goodle, sem API externa obrigatória como núcleo.

### HEP
Hyper-Engine Points. Não vendidos por dinheiro; ligados à criação/escrita no ecossistema.

### GoodStore
Recompensas, itens digitais, avatar/personalizações e eventualmente recompensas de valor real sob regras específicas de elegibilidade, segurança e antiabuso.

### Doods
Experiências/eventos oficiais criados pela equipe Goodle, não pelos usuários.

### GoodPoints
Sistema separado de HEP. Exemplos conceituais registrados no PDD: pesquisa pode gerar GoodPoint; Doods podem conceder GoodPoints; acesso a recompensas depende das regras da GoodStore.

### Outros elementos
- Avatar;
- Goodle Search;
- Doods Search;
- Good — THE AI;
- Goodle Funspace;
- pesquisa internacional/regional;
- relógio/calendário/cronômetro/marca-tempo/captura/notícias/sincronização;
- Modo Trabalhador;
- Modo FIFA;
- tutorial de primeiro acesso.

## 3. Princípio de simplicidade componível

Objetivo técnico: **componentização e simplicidade para criar coisas complexas**.

O Goodle é simultaneamente:
- vibe-coding;
- low-code;
- block-code;
- linguagem textual OldRewrite;
- acesso avançado à manifestação técnica quando necessário.

Essas não são implementações independentes. São visões do mesmo projeto.

## 4. GoodProject — fonte de verdade

**GoodProject é a fonte estrutural de verdade.**

Fluxo conceitual:

```text
VIBE       LOW       BLOCK
  \         |         /
       GOODPROJECT
            ↕
       OLDREWRITE
            ↓
   manifestação técnica
```

Regras:
- Block-code não possui AST independente;
- Low-code não possui modelo paralelo;
- OldRewrite projeta/edita a semântica do GoodProject;
- TypeScript é manifestação técnica avançada;
- IDs devem permanecer estáveis;
- operações em lote devem poder ser atômicas;
- inferências devem ter proveniência e ser editáveis.

## 5. Idioma e sintaxe flexíveis

### Regra canônica
**PT-BR first, mas não PT-BR only.**

O parser deve aceitar:
- PT-BR com acentos;
- PT-BR sem acentos;
- inglês;
- mistura livre quando semanticamente reconhecível.

Exemplos de aliases:

```text
quando / when
se / if
senão / senao / else
mostrar / show
criar / create
abrir / open
fechar / close
definir / set
carregar / load
salvar / save
```

Exemplo válido de mix:

```text
quando player entrar na cidade:
  if player tem chave:
    abrir portal
  else:
    show Você conseguiu!
```

A saída semântica deve ser a mesma AST/IR Goodle.

### Sintaxe aceita x sintaxe canônica
- **Sintaxe aceita:** pode misturar aliases e origens.
- **Sintaxe canônica:** representação preferencial PT-BR do Goodle.

## 6. Tripé de manifestação

React + Phaser + Backend formam um tripé interno, mas **não aparecem como três produtos/engines que o criador precisa escolher**.

- React-like: composição/interface/app;
- Phaser-like: runtime de experiências/jogos e contribuição para mundo/interação;
- Backend-like: dados, autenticação, persistência, APIs, serviços e capacidades.

## 7. Fusão das quatro bases de engine

Decisão canônica: **Phaser-like + Godot-like + BYOND-like + RPG-Maker-like são fontes de know-how fundidas em UMA GoodEngine.**

O usuário não escolhe uma engine. O Goodle extrai conceitos úteis e os representa nativamente.

### Phaser-like
- cenas;
- game loop;
- input;
- câmera;
- física;
- animação;
- sprites/objetos de jogo.

### Godot-like
- scene tree;
- node;
- composição;
- scenes reutilizáveis;
- signals;
- resources;
- instanciação.

### BYOND-like
- world;
- atom;
- mob;
- obj;
- turf;
- area;
- verb;
- proc;
- mundo/multiplayer persistente.

### RPG-Maker-like
- map;
- event;
- page;
- switch;
- variable;
- common event;
- database;
- event commands.

## 8. GoodWorld Model

A Task 2 evoluiu de simples store para **GoodProject + GoodWorld Model V0**.

Princípio central aprovado:

> **Entidade é o objeto universal fundamental e componível.**

Personagem, NPC, árvore, porta, inimigo, item etc. são entidades compostas por componentes.

Mundo/Cena/Mapa/Espaço organizam entidades.

Vocabulário nativo inicial:
- Entidade;
- Componente;
- Espaço;
- Cena;
- Mapa;
- Área;
- Mundo;
- Evento;
- Ação;
- Comportamento;
- Dado;
- Estado;
- Regra;
- Recurso;
- Sistema.

## 9. Semantic Bridge — equivalência de engines + idioma

O mesmo princípio de equivalência linguística deve existir para elementos das engines.

Exemplo conceitual:

```text
RPG Maker Event ─┐
BYOND proc/verb ─┼─> semântica Goodle
Godot signal ────┤
Phaser event ────┘
```

Porém equivalência **não significa identidade perfeita**.

Cada mapeamento deve registrar nível de equivalência, por exemplo:
- direta;
- aproximada;
- contextual;
- com perda.

Conversões com perda nunca devem ser silenciosas.

### Separação semântica importante

Não achatar `proc`, `func`, `function`, `signal`, `event`, `verb` e `Common Event` num único conceito sem contexto.

Núcleo proposto/aprovado para o dicionário:

```text
EVENTO  = algo aconteceu
AÇÃO    = faça algo
EMISSÃO = avise que algo aconteceu
REAÇÃO  = quando acontecer, execute
```

## 10. Famílias do Dicionário Semântico Goodle V1

1. **Estrutura:** projeto, mundo, cena, espaço, entidade, componente, recurso.
2. **Dados:** dado, estado, constante, lista, mapa-dados, tipo, referência.
3. **Lógica:** se, senão, repetir, para-cada, enquanto, escolher, retornar, parar.
4. **Comportamento:** ação, evento, emitir, ouvir, conectar, esperar, temporizador.
5. **Game/World:** personagem, objeto, terreno, área, mapa, câmera, física, colisão, animação, entrada.
6. **App/Backend:** interface, tela, rota, usuário, banco, coleção, registro, consulta, API, autenticação, salvar, carregar.
7. **Metalinguagem:** criar, remover, alterar, definir, usar, importar, estender, compor, instanciar.

Cada entrada futura do Semantic Dictionary deve poder registrar:
- `id_canônico`;
- `termo_ptbr`;
- aliases;
- origens;
- categoria;
- semântica;
- nível de equivalência;
- perdas/limitações;
- exemplos;
- representação Goodle IR.

## 11. Matriz inicial de equivalências

| Goodle canônico | Phaser-like | Godot-like | BYOND-like | RPG-Maker-like |
|---|---|---|---|---|
| entidade | Game Object | Node | atom/datum | Event/objeto contextual |
| personagem | Sprite/Game Object | CharacterBody/Node | mob | Actor/Event contextual |
| objeto | Game Object | Node | obj | Event/Item contextual |
| terreno | Tile/Tilemap | TileMap/Node | turf | Map Tile |
| área | Scene/zone contextual | Scene/Node contextual | area | Map/Region contextual |
| mundo | Game/Scenes | SceneTree/contexto | world | projeto/mapas contextual |
| cena | Scene | Scene | contexto/mapa | Map contextual |
| componente | componente/config | Node filho/composição | composição/vars | configuração contextual |
| dado | property/data | var/property | var | Variable |
| estado | boolean | bool | var/flag | Switch |
| ação | function/method contextual | func/method | proc/verb contextual | Event Command/Common Event contextual |
| evento | event | signal/callback contextual | callback/proc contextual | Event |
| emitir | emit | signal emit | call/event contextual | Common Event/command contextual |
| condição | if | if | if | Conditional Branch |
| senão | else | else | else | Else |
| repetir | loop/update | for/while | for/while | Loop |
| parar | break | break | break | Break Loop |
| recurso | asset | Resource | arquivo/icon/sound contextual | Resource |
| entrada | Input | Input | client/verb/key contextual | Input/Button contextual |
| física | physics | physics bodies | movimento/world contextual | movement rules contextual |
| câmera | Camera | Camera2D/3D | client eye/view contextual | viewport/map contextual |
| salvar | storage | FileAccess/Resource | savefile | Save Game |
| carregar | loader | load/preload | file/savefile | Load Game |

Esta matriz é inicial e deverá ser expandida exaustivamente antes de ser considerada completa.

## 12. GoodStudio — mockup aprovado

Modelo visual: **híbrido progressivo**.

Usuário pode começar simples e revelar camadas:

```text
Vibe → Low-code → Block-code → OldRewrite → TypeScript avançado
```

Áreas principais do shell:
- cabeçalho;
- Projeto/navegação;
- Preview;
- OldRewrite/editor;
- Good — THE AI;
- GoodRuntime/status.

Seções planejadas:
- Início;
- Interface;
- Mundo;
- Componentes;
- Dados;
- Lógica;
- Backend;
- Assets;
- Segurança.

React, Phaser e Backend ficam como manifestação interna e não como escolha primária do criador.

## 13. Backend visual

Capacidades planejadas:
- Usuário;
- Perfil;
- Login/Autenticação;
- Banco;
- API;
- Arquivo;
- Evento;
- Tarefa;
- Notificação;
- Integração;
- Persistência;
- permissões/capacidades.

Runtime backend definitivo ainda não deve ser escolhido apenas pelo mockup.

## 14. Inferência

O Goodle pode inferir tipo, escopo, persistência e outras propriedades quando seguro/reversível.

Exemplo:

```text
vida = 100
```

pode sugerir número, mas:
- inferência fica visível;
- possui origem/proveniência;
- usuário pode sobrescrever;
- decisão manual prevalece.

## 15. Round-trip e TypeScript

Estados planejados:
- representável;
- parcialmente representável;
- código avançado.

Não prometer conversão perfeita de TypeScript arbitrário para Low/Block/OldRewrite.

## 16. Fontes oficiais de conhecimento adicionadas

Repositórios de conferência/know-how:
- `tehknesolutions/codex-hnk`;
- `tehknesolutions/tehkne-os`;
- `tehknesolutions/HNK-KODE`;
- `tehknesolutions/HNK-VERSE`.

Política detalhada também registrada em `docs/KNOWLEDGE-SOURCES.md`.

Eles são fontes de conhecimento/conferência, não dependências automáticas de runtime.

## 17. Estado remoto e política de execução

Decisão operacional do projeto nesta sessão:

> **Trabalhar somente no remoto: ChatGPT + GitHub.**

Não depender de execução local/Desktop Commander/PC do usuário para este fluxo.

Quando não houver executor remoto funcional, distinguir claramente:
- implementado;
- revisado estaticamente;
- validado por teste;
- não validado.

Nunca declarar testes verdes sem execução real.

## 18. CI

Foi criado `.github/workflows/ci.yml` com intenção de executar:

```text
npm install
npm test
npm run check
npm run build
```

Durante a sessão, GitHub Actions ainda aparecia sem runs para as branches consultadas. Portanto nenhuma afirmação de GREEN deve ser feita apenas pela presença do workflow.

## 19. Estado de implementação desta sessão

### OldRewrite
- modelo AST recebeu suporte a `senao`;
- parser recebeu suporte inicial a blocos `se/senão` por indentação;
- teste inicial de condição foi criado;
- Vitest foi adicionado/configurado no package.json;
- validação remota efetiva ainda dependia do executor.

### GoodStudio Shell
Na branch de trabalho foram adicionados:
- `EstudioGoodle.test.tsx`;
- `PainelComponentes.tsx`;
- `Previa.tsx`;
- `EditorIntencao.tsx`;
- atualização de `EstudioGoodle.tsx`;
- `src/estilos.css` responsivo.

O shell representa Projeto + Prévia + OldRewrite + Good AI + GoodRuntime.

### GoodProject Task 2
Foi iniciado o contrato de teste para:
- fonte única de verdade;
- dado editável;
- revisão;
- lote atômico.

A evolução aprovada transforma esta Task em **GoodProject + GoodWorld Model V0** antes de Low-code e Block-code.

## 20. Plano técnico já definido

Fluxo vertical alvo:

```text
Intenção
→ proposta GAIC
→ GoodProject
→ Low-code ↔ Block-code ↔ OldRewrite
→ React/Phaser Preview + Backend visual
```

Fases planejadas:
1. Shell GoodStudio;
2. GoodProject único;
3. OldRewrite multilíngue;
4. Dados/inferência;
5. Low-code;
6. Block-code como projeção;
7. Preview React + Phaser;
8. Backend visual;
9. GAIC/Vibe-coding;
10. Assets/Segurança;
11. TypeScript avançado;
12. integração vertical completa.

Esse plano agora deve incorporar GoodWorld Model + Semantic Bridge antes das projeções Low/Block.

## 21. Arquitetura consolidada atual

```text
                         GOODLE
                           │
                      GOODENGINE
                           │
          ┌────────────────┴────────────────┐
          │                                 │
   GOOD WORLD MODEL                  GOOD APP MODEL
          │                                 │
   Phaser-like                        React-like
   Godot-like                         UI/componentes
   BYOND-like                              │
   RPG-Maker-like                    Backend-like
          │                                 │
          └──────────── GOODPROJECT ────────┘
                           │
                  GOODLE SEMANTIC IR
                           ↕
                  SEMANTIC BRIDGE
                ↙          ↓          ↘
          idiomas       engines      aliases
                           ↕
                      OLDREWRITE
                           │
        ┌──────────────────┼──────────────────┐
       VIBE              LOW               BLOCK
                           │
                  manifestação técnica
                           │
                 React + Phaser + Backend
```

## 22. Próxima etapa aprovada conceitualmente

Construir a especificação formal do **Goodle Semantic Dictionary / Semantic Bridge**, expandindo exaustivamente:
- sintaxe OldRewrite;
- aliases PT-BR com acento;
- aliases PT-BR sem acento;
- inglês;
- mix;
- Phaser-like;
- Godot-like;
- BYOND-like;
- RPG-Maker-like;
- React/TypeScript/backend quando aplicável;
- Goodle canônico PT-BR;
- representação Goodle IR;
- níveis de equivalência e perdas.

## 23. Regra de preservação

Nenhuma decisão deste registro deve ser tratada como implementação concluída apenas por estar documentada. O documento preserva o **cânone de produto e arquitetura da sessão**; código, testes e validação possuem seus próprios estados.
