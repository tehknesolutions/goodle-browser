# Modelo de Componentes Goodle

## Princípio

**Componente pequeno + composição = sistema complexo.**

## Uma composição

O Goodle possui um modelo único de componentes. Não existe uma biblioteca “React” separada de uma biblioteca “Phaser” para o criador.

Os componentes podem usar diferentes capacidades internas de manifestação.

## Bases sintáticas

React fornece a base conceitual para composição, propriedades, estado, eventos e componentes declarativos.

Phaser fornece a base conceitual para cenas, entidades, interação, animação, câmera, física e mundo 2D.

Essas bases são combinadas pela arquitetura Goodle.

## Contrato

Cada componente pode declarar:
- identidade;
- propriedades;
- estado;
- eventos;
- ações;
- dependências;
- entradas;
- saídas;
- capacidades;
- manifestação;
- configuração;
- testes.

## Exemplo

O usuário cria **Personagem**.

O componente pode internamente combinar propriedades, estado, eventos, visual, movimento, animação e colisão.

Não existem “Personagem React” e “Personagem Phaser” como conceitos de produto.

O Goodle resolve a manifestação.

## Objetivo

GAIC deve conseguir gerar sistemas complexos como composição de peças compreensíveis e reutilizáveis.
