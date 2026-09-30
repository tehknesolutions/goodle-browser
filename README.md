# GOODLE BROWSER

**Goodle é PT-BR first.**

Goodle é um ambiente de criação com IA para transformar intenção humana em experiências digitais complexas por meio de componentes simples e composáveis.

## Bases tecnológicas

- **React** — base da interface, GoodStudio, componentes de aplicação e experiências web.
- **Phaser** — base das experiências de jogo e interações 2D.
- **React + Phaser** — arquitetura híbrida para experiências que precisam de interface de aplicação + mundo interativo.
- **Godot-like** — referência para cenas, nodes, signals, recursos, hierarquia, física e navegação.
- **BYOND-like** — referência para atoms, mundo, proc/verb, cliente, persistência e servidor.
- **RPG-Maker-like** — referência para mapas, eventos, páginas, switches, variables e common events.

As referências são normalizadas semanticamente pelo Goodle; não são tratadas como APIs tecnicamente idênticas.

## Princípio de produto

> **Componetização + simplicidade para criar coisas complexas.**

O criador combina componentes, sistemas, regras e eventos. A complexidade deve surgir da composição.

## PT-BR first

Produto, documentação, UX, mensagens, exemplos e conceitos são escritos primeiro em português do Brasil. Inglês é reservado a APIs, bibliotecas, identificadores técnicos e interoperabilidade quando necessário. PT-BR, inglês e mistura convergem quando houver equivalência semântica registrada.

## Arquitetura

`Intenção → Componentes → Composição → Regras → Eventos → Runtime → Experiência`

Entradas como OldRewrite, block-code, low-code, vibecoding e GAIC convergem para um **Goodle IR único**, processado pelo Semantic Bridge e pelo HyperKernel.

## Behavior/Event Model V1

O primeiro modelo reativo universal está implementado na branch `feat/goodle-behavior-events-v1`.

Fluxo provado em código:

`evento → quando → ação`

Vertical slice:

`vida 100 → evento.toque → diminuir 10 → vida 90`

A implementação inclui Semantic Dictionary, parser PT-BR/EN/misto, validação IR, RuntimeMemoria reativo, registro no HyperKernel e teste E2E.

**Estado atual:** implementação completa / **não certificada pelo CI**.

## Documentação mestre

- `docs/PROJECT-SUMMARY-2026-09-29.md`
- `docs/KNOWLEDGE-SOURCES.md`
- `docs/arquitetura/GOODLE-BEHAVIOR-EVENT-MODEL-V1.md`
- `docs/superpowers/plans/2026-09-29-goodle-behavior-events-v1.md`
- `docs/ARCHITECTURE.md`
- `docs/COMPONENT-MODEL.md`
- `docs/00-MASTER-INDEX.md`

## Fontes de conhecimento

O projeto registra como fontes HNK/Tehkné:

- `tehknesolutions/codex-hnk`
- `tehknesolutions/tehkne-os`
- `tehknesolutions/HNK-KODE`
- `tehknesolutions/HNK-VERSE`

Essas fontes alimentam conhecimento e equivalências; o Goodle continua sendo a fonte de verdade da implementação.

## Status

**Fundação + arquitetura + Behavior/Event Model V1 implementados.**

O PR #36 permanece Draft enquanto o GitHub Actions não fornecer evidência verificável de `npm test + npm run check + npm run build`.
