# G0.2 — Primeiro leitor da Sintaxe Goodle

## Status

**IMPLEMENTAÇÃO INICIAL**

O Goodle agora possui um leitor mínimo para a forma declarativa:

```
quando jogador entrar na cidade:
  carregar perfil
  mostrar missão atual
  abrir diálogo do NPC
```

## O que já existe

O leitor reconhece:

- um evento inicial com `quando`;
- uma sequência de ações;
- uma estrutura `FluxoGoodle`;
- expressões de evento e ação;
- erros básicos de sintaxe.

## O que ainda não existe

Ainda não é um compilador completo.

Não estão implementados nesta etapa:

- parâmetros tipados;
- condições;
- variáveis;
- operadores;
- blocos aninhados;
- persistência;
- geração TypeScript;
- execução real;
- editor visual.

## Direção

A sintaxe deve evoluir incrementalmente.

O mesmo modelo deverá alimentar:

- vibe-coding;
- low-code;
- block-code;
- manifestação TypeScript.

## Regra

A sintaxe Goodle deve continuar simples para humanos e suficientemente estruturada para máquinas.
