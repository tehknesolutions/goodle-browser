# Sintaxe Goodle — Fundação

## Status
**CANON / FUNDAÇÃO**

A sintaxe Goodle é a camada que unifica vibe-coding, low-code, block-code e código avançado em uma única representação.

O criador não precisa escolher React, Phaser ou Backend.

Ele descreve uma intenção e trabalha com componentes, propriedades, estado, eventos, dados, regras e ações.

## Princípio

**Uma representação interna, várias formas de edição.**

```
Vibe-coding
     ↓
Low-code
     ↓
Block-code
     ↓
Código
     ↓
      \
       → GoodProject ←
      /
```

## Unidades fundamentais

### Componente
Uma unidade reutilizável de construção.

### Propriedade
Uma característica configurável do componente.

### Estado
Informação que pode mudar durante a execução.

### Evento
Algo que acontece.

### Condição
Uma regra que determina se algo deve acontecer.

### Ação
Algo que o sistema executa.

### Dado
Informação persistente ou temporária.

### Serviço
Uma capacidade externa ou de backend.

### Regra
Uma restrição ou comportamento declarativo.

## Exemplo em linguagem natural

> Quando o jogador entrar na cidade, carregar o perfil, mostrar a missão atual e abrir o diálogo do NPC.

## Mesma intenção em blocos

```
QUANDO jogador entrar na cidade
        ↓
CARREGAR perfil
        ↓
MOSTRAR missão atual
        ↓
ABRIR diálogo do NPC
```

## Mesma intenção em sintaxe declarativa

```
quando jogador entrar em cidade:
  carregar perfil
  mostrar missão atual
  abrir diálogo do NPC
```

## Regra

Essas formas não representam projetos diferentes.

Todas representam a mesma operação Goodle.

## Progressive disclosure

O criador começa com intenção.

Quando precisar de controle, pode abrir:
1. componentes;
2. propriedades;
3. eventos;
4. condições;
5. ações;
6. regras;
7. dados;
8. blocos;
9. código.

## Manifestação

A sintaxe Goodle não deve expor detalhes de React, Phaser ou backend no nível básico.

A manifestação técnica pode utilizar TypeScript e as bases do tripé internamente.

## Objetivo

Fazer com que:

**simples de escrever ≠ limitado**

e

**poderoso ≠ difícil.**
