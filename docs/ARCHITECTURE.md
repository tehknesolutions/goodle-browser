# Arquitetura do Goodle

## Regra linguística

**PT-BR first sempre.**

Todo o produto, documentação, interface, nomenclatura de domínio, mensagens, exemplos, templates, prompts, estados, erros e fluxos do Goodle devem nascer em português do Brasil.

Inglês só aparece quando for nome técnico de tecnologia/API/biblioteca, termo obrigatório de dependência, identificador de código com justificativa técnica ou interoperabilidade externa.

Quando houver escolha entre inglês e equivalente claro em PT-BR, o PT-BR vence.

## Princípio central

**Componetização + simplicidade para criar coisas complexas.**

O Goodle permite criar experiências complexas combinando componentes pequenos, previsíveis e reutilizáveis.

Complexidade deve emergir da composição, não da necessidade de compreender uma arquitetura complexa.

## Duas bases de interface/experiência

### React

React é a base principal para:
- interface do Goodle;
- GoodStudio;
- editor;
- painéis;
- inspeção;
- configuração;
- gerenciamento de projeto;
- componentes reutilizáveis;
- experiências web que não dependem do loop de jogo.

### Phaser

Phaser é a base principal para:
- jogos 2D;
- cenas;
- sprites;
- animações;
- física 2D quando aplicável;
- entrada/interação de jogo;
- câmera;
- áudio de jogo;
- loops de jogo;
- experiências interativas 2D.

### Regra React × Phaser

React controla a **interface e composição da aplicação**.

Phaser controla o **mundo interativo/game loop**.

Eles podem coexistir na mesma experiência:

React
├── Menu
├── HUD
├── Inventário
├── Configurações
└── Phaser
    ├── Cena
    ├── Mundo
    ├── Entidades
    ├── Física
    └── Interações

O Goodle não deve forçar o usuário a escolher entre React e Phaser quando uma experiência híbrida fizer sentido.

## Camada de componentes

Tudo que puder ser reutilizado deve virar componente ou sistema composável.

### Componentes de aplicação

Botão, Painel, Modal, Menu, Formulário, Lista, Editor, Inspetor, Barra de ferramentas, Navegação, Notificação.

### Componentes de jogo

Personagem, Inimigo, NPC, Item, Projétil, Portal, Tilemap, Câmera, Zona, Trigger, Partícula, Efeito, Vida, Inventário, Diálogo.

### Componentes de experiência

Cena, Estado, Regra, Evento, Ação, Condição, Variável, Objetivo, Missão, Progressão.

## Composição

A unidade fundamental do Goodle não deve ser a página nem o arquivo.

Deve ser o **componente composável**.

Exemplo:

`Personagem + Movimento + Vida + Inventário + Diálogo + Missão`

gera uma entidade complexa sem exigir que o criador programe todo o sistema do zero.

## Fluxo arquitetural

Intenção
→ Componentes
→ Composição
→ Regras
→ Eventos
→ Runtime
→ Experiência

GAIC ajuda a converter a intenção em composição.

## Camadas

GOODLE
├── Goodle Browser / Studio
│   └── React
├── GoodProject
├── Component System
├── GAIC
├── OldRewrite
├── OldTable
├── GoodEngine
├── GoodRuntime
│   ├── React Runtime
│   └── Phaser Runtime
├── Capability Broker
├── Event / Artifact / Provenance
└── HEPGA

## Simplicidade

A arquitetura interna pode ser sofisticada.

A experiência do criador não pode exigir que ele compreenda toda essa sofisticação.

**Regra: complexidade interna, simplicidade externa.**

## Regra para novas tecnologias

Uma nova engine, framework ou runtime só entra no núcleo quando demonstrar necessidade que React + Phaser não atendem adequadamente.

A adição de tecnologia deve reduzir complexidade para o criador, não aumentá-la.

## Regra de arquitetura

Nenhum componente de IA deve ser simultaneamente planejador irrestrito e executor irrestrito.
