# GOODLE IR — Especificação Arquitetural V1

## Status
APROVADO para planejamento. PT-BR first.

## Objetivo
Criar a representação intermediária universal da GoodEngine: toda intenção escrita, visual ou gerada por IA converge para uma estrutura semântica única antes de chegar ao runtime.

## Fluxo canônico

```text
OldRewrite / Block-code / Vibecoding / GAIC
                    ↓
              Parser Goodle
                    ↓
                Goodle IR
                    ↓
             Semantic Bridge
                    ↓
              HyperKernel
                    ↓
 React + Phaser + Backend + adaptadores Godot-like/BYOND-like/RPG-Maker-like
                    ↓
                  HEPGA
```

## Princípios
1. PT-BR é a forma canônica de apresentação e documentação.
2. Entrada pode usar PT-BR com ou sem acentos, inglês ou mistura dos dois.
3. O IR não é código final de nenhuma engine.
4. Conceitos convergem para IDs semânticos canônicos já definidos pelo Semantic Dictionary.
5. Diferenças entre tecnologias não são apagadas: origem, equivalência e metadados são preservados.
6. Vibecoding, low-code, block-code e escrita manual devem produzir a mesma representação intermediária.
7. Composição e simplicidade são preferidas para permitir sistemas complexos.

## Famílias V1

### estrutura
Entidades, componentes, cenas, mapas, recursos, hierarquia e composição.

### dados
Valores, propriedades, estados, listas, dicionários e referências.

### comportamento
Ações, funções, eventos, reações, condições, repetições e emissões.

### mundo
Posição, transformação, câmera, física, visual, navegação, áudio, interface e gameplay.

### execução
Lifecycle, criação/destruição, persistência, backend, rede e integração com runtime.

## Nó IR mínimo

```ts
type GoodleIRNode = {
  id: string;
  semantica: string;
  familia: "estrutura" | "dados" | "comportamento" | "mundo" | "execucao";
  parametros?: Record<string, unknown>;
  filhos?: GoodleIRNode[];
  origem?: {
    familia: string;
    termo?: string;
    equivalencia?: "direta" | "aproximada" | "contextual" | "com_perda";
  };
  metadados?: Record<string, unknown>;
};
```

## Exemplo
Entrada OldRewrite:

```text
criar personagem heroi
quando heroi tocar inimigo:
  diminuir vida em 10
```

Representação conceitual:

```json
{
  "semantica": "entidade.criar",
  "familia": "execucao",
  "parametros": { "tipo": "personagem", "nome": "heroi" }
}
```

O evento de colisão e a alteração de vida são nós separados ligados pela árvore de comportamento. O compilador/runtime não precisa conhecer a frase original para compreender a intenção.

## Fronteiras
- Parser: transforma entrada em IR; não executa jogo/app.
- Semantic Bridge: resolve conceitos e equivalências; não gera UI final.
- Goodle IR: descreve intenção normalizada; não depende de engine.
- HyperKernel: coordena execução e escolhe/adapta capacidades de runtime.
- Runtime adapters: traduzem operações do IR para capacidades concretas.
- HEPGA: empacota projeto, recursos, IR e metadados necessários.

## Compatibilidade
O Semantic Dictionary V1 é a fonte inicial dos IDs canônicos. O Goodle IR deve consumir esses IDs, evitando um segundo vocabulário paralelo.

## Critério de sucesso V1
Um pequeno programa OldRewrite deve ser parseado para Goodle IR, validado semanticamente e executado por pelo menos um runtime inicial sem que o parser contenha lógica específica desse runtime.

## Fora do escopo imediato
- implementar todas as capacidades das engines de referência;
- converter qualquer projeto Godot/BYOND/RPG Maker automaticamente;
- definir otimizações avançadas do compilador;
- congelar o formato HEPGA definitivo.
