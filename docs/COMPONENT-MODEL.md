# Modelo de Componentes Goodle

## Princípio

**Componente pequeno + composição = sistema complexo.**

## Contrato conceitual

Cada componente deve declarar:
- identidade;
- propriedades;
- estado;
- eventos;
- ações;
- dependências;
- entradas;
- saídas;
- capacidades necessárias;
- runtime alvo;
- configuração;
- testes.

## Tipos

### Aplicação
Componentes React.

### Jogo
Componentes Phaser.

### Híbrido
Composição React + Phaser.

### Sistema
Regras, eventos, estado, progressão, inventário, diálogo etc.

## Composição

Componente A + Componente B + Regra C → experiência.

A composição deve ser declarativa sempre que possível.

## Regra

Não criar um componente gigante quando uma composição de componentes menores resolver o mesmo problema.

## Objetivo

Permitir que GAIC gere sistemas complexos como composição de peças compreensíveis e reutilizáveis.
