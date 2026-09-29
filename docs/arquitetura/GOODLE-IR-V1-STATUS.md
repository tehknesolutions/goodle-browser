# Goodle IR V1 — Status e Gate

## Estado

**Implementação remota registrada; validação executável ainda não comprovada.**

Este documento não declara a V1 como GREEN. O GitHub Actions do projeto apresenta bloqueio de infraestrutura já isolado: workflows mínimos falham antes de expor steps/logs úteis. Portanto, existência de código e testes no repositório não equivale a execução aprovada.

## Fluxo V1 implementado

```text
OldRewrite
  ↓
ParserOldRewrite
  ↓
Semantic Bridge / Semantic Dictionary V1
  ↓
Goodle IR
  ↓
validarGoodleIR
  ↓
HyperKernel
  ↓
RuntimeGoodle
  ↓
RuntimeMemoria (prova inicial)
```

## Matriz requisito → implementação → teste

| Requisito | Implementação | Contrato/teste |
|---|---|---|
| Modelo intermediário universal | `src/nucleo/ir/GoodleIR.ts` | `GoodleIR.test.ts` |
| Reusar IDs do Semantic Dictionary | `criarNoSemantico.ts` | `criarNoSemantico.test.ts` |
| Rejeitar alias contextual sem origem | `criarNoSemantico.ts` | caso `signal` sem origem |
| Preservar origem/equivalência | `OrigemIR` + `criarNoSemantico` | caso `signal/godot` |
| Parser independente de runtime | `ParserOldRewrite.ts` | `ParserOldRewrite.test.ts` |
| PT-BR first com mistura EN | parser + Semantic Bridge | `criar entity heroi` e aliases semânticos |
| Diagnósticos semânticos | `validarGoodleIR.ts` | `SEMANTICA_DESCONHECIDA` |
| Diagnósticos estruturais | `validarGoodleIR.ts` | `FAMILIA_INVALIDA` |
| Diagnóstico recursivo | `validarGoodleIR.ts` | caminho `nos[0].filhos[0]...` |
| Contrato universal de runtime | `ContratoRuntimeGoodle.ts` | `HyperKernel.test.ts` |
| IR inválido não executa | `HyperKernel.ts` | teste de bloqueio antes do runtime |
| Semântica válida não suportada é explícita | `HyperKernel.ts` | resultado `nao_suportado` |
| Primeiro runtime concreto | `runtime/memoria/RuntimeMemoria.ts` | `RuntimeMemoria.test.ts` |
| Slice ponta a ponta | parser + IR + kernel + memória | `GoodleIR.e2e.test.ts` |

## Exemplo mínimo

Entrada OldRewrite:

```text
criar personagem heroi
```

Forma conceitual esperada no IR:

```json
{
  "versao": "1",
  "nos": [
    {
      "semantica": "entidade.criar",
      "familia": "execucao",
      "parametros": {
        "tipo": "personagem",
        "nome": "heroi"
      }
    }
  ]
}
```

Efeito esperado no runtime de prova:

```json
[
  { "nome": "heroi", "tipo": "personagem" }
]
```

## Validação necessária para GREEN

Executar em ambiente funcional, a partir da branch V1:

```bash
npm test
npm run check
npm run build
```

Só considerar o gate GREEN se os três comandos terminarem com sucesso e sem falhas ocultas. Teste isolado não substitui a suíte completa.

## Estado do CI remoto

O problema do Actions foi separado do código de aplicação com um workflow mínimo de diagnóstico. Esse workflow também falhou antes de disponibilizar steps/logs normais. Assim, o bloqueio remoto deve permanecer classificado como **infraestrutura Actions/runner** até nova evidência.

Consequências:

- não alterar a ontologia para tentar corrigir um erro sem log;
- não afirmar que Vitest, TypeScript ou build são a causa sem evidência;
- não marcar a V1 como GREEN apenas porque os contratos foram escritos;
- manter código/produto e infraestrutura CI como trilhas de diagnóstico distintas.

## Limites atuais da V1

- O parser OldRewrite cobre deliberadamente apenas o primeiro slice de criação de entidade/personagem.
- `RuntimeMemoria` implementa apenas `entidade.criar`.
- Phaser, backend, Godot-like, BYOND-like e RPG-Maker-like ainda não são runtimes V1; suas equivalências vivem no Semantic Dictionary e serão consumidas por adaptadores posteriores.
- HEPGA ainda não está congelado como formato final.
- Block-code, low-code e GAIC ainda não possuem produtores próprios de IR nesta etapa; a arquitetura permite que sejam adicionados sem mudar o contrato central.

## Gate de promoção

A V1 pode avançar de **implementada / aguardando validação** para **validada** somente após:

1. `npm test` completo com zero falhas;
2. `npm run check` com sucesso;
3. `npm run build` com sucesso;
4. revisão das mudanças da branch;
5. confirmação de que Parser → IR → HyperKernel continua sem dependência direta de engine específica.

## Próximo marco recomendado após o GREEN

Expandir verticalmente, não horizontalmente: adicionar um segundo comportamento pequeno e completo (por exemplo posição/movimento ou propriedade/estado) atravessando a mesma esteira inteira antes de criar adaptadores grandes de engine. Isso testa se a arquitetura escala sem transformar o Goodle IR em um espelho de uma engine específica.
