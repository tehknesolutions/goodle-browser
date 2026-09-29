# Fontes de conhecimento do Goodle

O Goodle usa estes repositórios como fontes de conhecimento e conferência arquitetural. Eles não são dependências automáticas de runtime e não devem ser copiados cegamente: decisões importadas precisam indicar origem, equivalência e adaptação ao modelo nativo Goodle.

## Fontes internas Tehkné/HNK

| Repositório | Papel no Goodle |
|---|---|
| `tehknesolutions/codex-hnk` | referência de organização de conhecimento, codificação, equivalências e modelos HNK consolidados |
| `tehknesolutions/tehkne-os` | referência de arquitetura de sistema, componentização, integração e know-how Tehkné Solutions |
| `tehknesolutions/HNK-KODE` | referência para linguagem, normalização, equivalências, aliases e representação simbólica |
| `tehknesolutions/HNK-VERSE` | referência para mundos, entidades, universos/experiências e composição de estruturas |

## Regra de equivalência Goodle

O mesmo princípio usado na linguagem vale para conceitos de engines: diferentes palavras e modelos podem apontar para uma mesma semântica canônica Goodle.

Exemplo conceitual:

```text
RPG Maker Event ─┐
BYOND proc/verb ─┼─> Evento/Comportamento Goodle
Godot signal ────┤
Phaser event ────┘
```

A equivalência não significa que os conceitos originais sejam idênticos. O Goodle deve registrar diferenças de capacidade e contexto para evitar conversões com perda silenciosa.

## Fontes de engine absorvidas

A GoodEngine funde know-how de quatro famílias em um único GoodWorld Model:

- Phaser-like: cena, loop, input, câmera, física, animação e objetos de jogo;
- Godot-like: scene tree, node, composição, signal, resource e instanciação;
- BYOND-like: world, atom, mob, obj, turf, area, verb/proc e mundo multiplayer persistente;
- RPG-Maker-like: map, event, page, switch, variable, common event e database.

Essas famílias não aparecem como engines separadas obrigatórias para o criador. Elas alimentam conceitos nativos do Goodle como Entidade, Componente, Espaço, Cena, Mapa, Evento, Comportamento, Dado, Regra, Recurso, Sistema e Mundo.

## Política de uso

1. PT-BR first, aceitando PT-BR com ou sem acentos, inglês e mix.
2. Aliases textuais e aliases conceituais de engines convergem para IDs semânticos canônicos.
3. GoodProject continua sendo a fonte de verdade.
4. Entidade é o objeto universal componível do GoodWorld Model.
5. Não presumir equivalência perfeita entre conceitos externos.
6. Toda equivalência com perda deve ser marcada explicitamente.
7. As fontes devem ser consultadas antes de decisões arquiteturais que pretendam reutilizar know-how específico delas.
