# Goodle Semantic Bridge — Design Spec

**Status:** aprovado conceitualmente em 2026-09-29

## Objetivo

Criar uma camada semântica única que aceite vocabulário e construções vindas de PT-BR, PT-BR sem acentuação, inglês e das famílias Phaser-like, Godot-like, BYOND-like e RPG-Maker-like, normalizando tudo para conceitos nativos Goodle sem apagar diferenças relevantes.

## Princípios

1. PT-BR é a representação canônica preferencial.
2. Sintaxe aceita pode usar PT-BR, PT-BR sem acentos, inglês ou mix.
3. Conceitos das quatro engines são fontes de know-how, não subsistemas independentes.
4. GoodProject é a fonte de verdade.
5. GoodWorld Model é o modelo universal de mundos/experiências.
6. Entidade é o objeto universal componível.
7. Block-code e Low-code projetam a mesma semântica; não criam ASTs paralelas.
8. Toda equivalência registra fidelidade: `direta`, `aproximada`, `contextual` ou `com_perda`.
9. Perda semântica nunca é silenciosa.
10. O parser deve separar normalização lexical de resolução semântica.

## Pipeline

```text
Entrada do criador
  ↓
Normalização lexical
  ↓
Aliases linguísticos
  ↓
Aliases/conceitos de engine
  ↓
Resolução contextual
  ↓
Goodle Semantic IR
  ↓
GoodProject / GoodWorld Model
  ↓
OldRewrite canônico / Low / Block / Preview / manifestação técnica
```

## GoodWorld Model V0

### Estrutura
- Projeto
- Mundo
- Espaço
- Cena
- Mapa
- Área
- Entidade
- Componente
- Recurso
- Sistema

### Dados
- Dado
- Estado
- Constante
- Lista
- Mapa de dados
- Tipo
- Referência

### Comportamento
- Evento: algo aconteceu.
- Ação: execute algo.
- Emissão: comunique que algo aconteceu.
- Reação: quando algo acontecer, execute comportamento.
- Comportamento
- Regra
- Temporizador

### Mundo/jogo
- Personagem
- Objeto
- Terreno
- Câmera
- Física
- Colisão
- Animação
- Entrada

### App/backend
- Interface
- Tela
- Rota
- Usuário
- Autenticação
- Banco
- Coleção
- Registro
- Consulta
- API
- Arquivo
- Persistência
- Notificação
- Integração

## Famílias de origem

### Phaser-like
Contribui principalmente com Scene, game loop, input, camera, physics, animation, sprites/game objects e eventos de runtime.

### Godot-like
Contribui com Node, Scene, SceneTree, composição, signals, resources e instanciação.

### BYOND-like
Contribui com world, datum/atom, mob, obj, turf, area, proc, verb, client e conceitos de mundo persistente/multiplayer.

### RPG-Maker-like
Contribui com Map, Event, Event Page, Event Command, Switch, Variable, Common Event, Database e fluxo visual orientado a eventos.

## Regra crítica de equivalência

Uma origem não é convertida diretamente em outra origem. Todas convergem para Goodle IR.

```text
Phaser ───┐
Godot ────┼──> Goodle Semantic IR
BYOND ────┤
RPG Maker ┘
```

Exemplo: `signal`, `proc`, `verb`, `event` e `Common Event` podem participar de uma mesma família semântica, mas não são automaticamente idênticos. O contexto decide se representam Evento, Ação, Emissão, Reação ou combinação desses conceitos.

## Modelo de entrada do dicionário

```ts
type NivelEquivalencia = "direta" | "aproximada" | "contextual" | "com_perda";

type EntradaSemantica = {
  idCanonico: string;
  termoPtBr: string;
  categoria: string;
  aliases: string[];
  origens: Array<{
    familia: "goodle" | "phaser" | "godot" | "byond" | "rpg-maker" | "typescript" | "react" | "backend";
    termo: string;
    equivalencia: NivelEquivalencia;
    observacao?: string;
  }>;
  descricao: string;
  perdas?: string[];
  exemplos?: string[];
};
```

## Núcleo de aliases linguísticos

| Goodle PT-BR | Aliases aceitos |
|---|---|
| quando | `quando`, `when` |
| se | `se`, `if` |
| senão | `senão`, `senao`, `else` |
| criar | `criar`, `create` |
| mostrar | `mostrar`, `show` |
| abrir | `abrir`, `open` |
| fechar | `fechar`, `close` |
| definir | `definir`, `set` |
| carregar | `carregar`, `load` |
| salvar | `salvar`, `save` |

A lista é extensível e deve viver fora do parser.

## Matriz semântica inicial

| Goodle | Phaser-like | Godot-like | BYOND-like | RPG-Maker-like |
|---|---|---|---|---|
| entidade | Game Object | Node | atom/datum | Event/objeto contextual |
| personagem | Sprite/Game Object | CharacterBody/Node | mob | Actor/Event contextual |
| objeto | Game Object | Node | obj | Event/Item contextual |
| terreno | Tile/Tilemap | TileMap/Node | turf | Map Tile |
| área | zone/scene contextual | Scene/Node contextual | area | Map/Region contextual |
| mundo | Game/Scenes | SceneTree/contexto | world | projeto/mapas contextual |
| cena | Scene | Scene | contexto/mapa | Map contextual |
| componente | config/component | Node filho/composição | composição/vars | configuração contextual |
| dado | property/data | var/property | var | Variable |
| estado | boolean | bool | flag/var | Switch |
| ação | function/method contextual | func/method | proc/verb contextual | Event Command/Common Event contextual |
| evento | event | signal/callback contextual | callback/proc contextual | Event |
| emissão | emit | signal emit | call/event contextual | Common Event/command contextual |
| condição | if | if | if | Conditional Branch |
| senão | else | else | else | Else |
| repetição | loop/update | for/while | for/while | Loop |
| parar | break | break | break | Break Loop |
| recurso | asset | Resource | file/icon/sound contextual | Resource |
| entrada | Input | Input | client/verb/key contextual | Input/Button contextual |
| física | physics | physics bodies | movimento/world contextual | movement rules contextual |
| câmera | Camera | Camera2D/3D | client eye/view contextual | viewport/map contextual |
| salvar | storage | FileAccess/Resource | savefile | Save Game |
| carregar | loader | load/preload | file/savefile | Load Game |

## Sintaxe Goodle canônica

```text
criar mundo AbraIsland

criar entidade jogador:
  componente visual
  componente colisao
  dado vida = 100
  dado nivel = 1 persistente

quando jogador entrar em Cidade:
  se jogador tem chave:
    abrir Portal
  senao:
    mostrar "Encontre a chave"
```

## Sintaxe aceita em mix

```text
create world AbraIsland

criar mob player:
  component visual
  componente collision
  var vida = 100

when player entrar em Cidade:
  if player tem chave:
    open Portal
  else:
    show "Encontre a chave"
```

As duas representações devem convergir para a mesma intenção semântica quando não houver ambiguidade.

## Diagnósticos

O Semantic Bridge deve conseguir retornar:
- alias desconhecido;
- alias conhecido mas ambíguo;
- equivalência contextual sem contexto suficiente;
- conversão com perda;
- construção não representável na camada de destino;
- sugestão de termo Goodle canônico.

## Fontes de conhecimento do projeto

Consultar, quando a decisão reutilizar know-how específico:
- `tehknesolutions/codex-hnk`;
- `tehknesolutions/tehkne-os`;
- `tehknesolutions/HNK-KODE`;
- `tehknesolutions/HNK-VERSE`.

Ver também `docs/KNOWLEDGE-SOURCES.md` e `docs/CHAT-CANON-2026-09-29.md`.

## Fora do escopo desta primeira versão

- emular integralmente qualquer uma das quatro engines;
- prometer compatibilidade binária com projetos dessas engines;
- conversão perfeita de código arbitrário;
- implementar UltraRender completo;
- definir runtime backend definitivo.

## Critério de sucesso V0

Um mesmo comportamento simples deve poder ser expresso usando vocabulário PT-BR, inglês ou aliases familiares das engines e resultar em um único Goodle Semantic IR, preservando avisos quando a equivalência for aproximada/contextual/com perda.
