# Arquitetura do Goodle

## Regra linguística

**PT-BR first sempre.**

Todo o produto, documentação, interface, nomenclatura de domínio, mensagens, exemplos, templates, prompts, estados, erros e fluxos do Goodle devem nascer em português do Brasil.

Inglês só aparece quando for nome técnico de tecnologia/API/biblioteca, termo obrigatório de dependência, identificador de código com justificativa técnica ou interoperabilidade externa.

## Princípio central

**Componetização + simplicidade para criar coisas complexas.**

O Goodle permite criar experiências complexas combinando componentes pequenos, previsíveis e reutilizáveis.

## React + Phaser como fundamentos

React e Phaser são **bases sintáticas e tecnológicas**, não produtos/runtimes separados na experiência do criador.

O Goodle possui sua própria camada de criação e composição.

Ela utiliza:
- padrões de composição declarativa de React;
- componentes, propriedades, estado e eventos de React;
- cenas, entidades, interação, animação, câmera, física e ciclo interativo de Phaser.

### O criador não escolhe

O usuário não precisa dizer “vou criar em React” ou “vou criar em Phaser”.

Ele diz o que quer criar.

O Goodle compõe internamente os recursos necessários.

## Modelo

`Intenção Goodle → Composição Goodle → Manifestação React/Phaser → GoodRuntime → Experiência`

React e Phaser são fundamentos internos da manifestação, não fronteiras de produto.

## Exemplo

Uma experiência pode conter interface, HUD, menu, personagem, mundo, física, inventário, diálogos, partículas e progressão.

Tudo pertence a uma única composição Goodle. Partes diferentes podem utilizar padrões React ou Phaser internamente sem expor essa separação ao criador.

## Componentes

Tudo que puder ser reutilizado deve virar componente ou sistema composável.

A unidade fundamental do Goodle é o **componente composável**.

`Personagem + Movimento + Vida + Inventário + Diálogo + Missão`

forma uma composição única.

## Fluxo

Intenção → Componentes → Composição → Regras → Eventos → Manifestação → GoodRuntime → Experiência

GAIC converte intenção em composição.

## Camadas

GOODLE
├── Goodle Browser / GoodStudio
├── GoodProject
├── Good Component System
├── GAIC
├── OldRewrite
├── OldTable
├── GoodEngine
├── GoodRuntime
│   └── manifestação React + Phaser
├── Capability Broker
├── Event / Artifact / Provenance
└── HEPGA

## Simplicidade

**Complexidade interna. Simplicidade externa.**

A arquitetura interna pode ser sofisticada; a experiência do criador não pode exigir que ele compreenda essa sofisticação.

## Novas tecnologias

Só entram no núcleo quando demonstram necessidade real e reduzem a complexidade do Goodle.
