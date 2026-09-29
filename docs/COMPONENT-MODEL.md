# Modelo de Componentes Goodle

## Princípio

**Componente pequeno + composição = sistema complexo.**

## Unidade fundamental

O componente é a unidade de criação reutilizável do Goodle.

Um componente declara:

- identidade;
- tipo;
- nome;
- versão;
- configuração;
- relações de composição.

## Tipos

### Aplicação

Componentes de interface e aplicação baseados em React.

### Jogo

Componentes de mundo e interação 2D baseados em Phaser.

### Sistema

Componentes de lógica, estado, regras e comportamento.

## Composição

Exemplo:

`Personagem + Movimento + Vida + Inventário + Diálogo`

não representa cinco projetos diferentes. Representa uma composição que pode formar uma experiência maior.

## Regra

Evitar componentes gigantes quando uma composição de componentes menores resolver o problema.

## Regra de simplicidade

A API interna pode ser sofisticada. A experiência do criador deve continuar simples.

## PT-BR first

Os nomes exibidos ao criador devem ser PT-BR first. Identificadores técnicos podem usar convenções de código quando necessário.

## Próximo marco

Conectar o registro ao GoodStudio e criar uma primeira experiência React + Phaser a partir de uma composição declarativa.
