# Goodle Behavior/Event Model V1

## Status
PROPOSTA ARQUITETURAL — aguardando aprovação antes do plano de implementação.

## Intenção preservada
Goodle é uma base única para vibecoding, low-code e block-code. A entrada pode usar PT-BR com ou sem acentos, inglês ou mistura. React, backend, Phaser e referências Godot-like, BYOND-like e RPG-Maker-like alimentam equivalências semânticas, mas não viram linguagens independentes dentro do Goodle.

O Goodle IR permanece a representação intermediária universal entre intenção e execução.

## Objetivo deste marco
Adicionar comportamento reativo ao Goodle sem acoplar o parser a uma engine concreta.

Primeiro fluxo-alvo:

```text
criar personagem heroi
criar personagem inimigo
quando heroi tocar inimigo:
  diminuir vida de heroi em 10
```

Fluxo arquitetural:

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
            RuntimeGoodle
                  ↓
      eventos → condições → ações
```

## Regra central
Evento, signal, callback, proc/verb e evento de RPG Maker podem compartilhar intenções parcialmente equivalentes, mas NÃO são declarados tecnicamente idênticos.

A normalização ocorre por intenção semântica e preserva:
- termo de origem;
- família de origem;
- nível de equivalência;
- parâmetros necessários;
- diferenças que não possam ser representadas sem perda.

## Modelo conceitual

### 1. Evento
Algo observável ocorreu.

Exemplos canônicos iniciais:
- `evento.toque`
- `evento.colisao`
- `evento.criado`
- `evento.atualizacao`

### 2. Gatilho
Liga um evento a uma reação.

ID canônico inicial:
- `comportamento.reacao.quando`

### 3. Condição
Decide se a reação continua.

Exemplos:
- `logica.condicao.se`
- comparações futuras de estado/dados.

### 4. Ação
Produz uma mudança observável.

Exemplos iniciais:
- `dados.valor.diminuir`
- `dados.valor.aumentar`
- `entidade.criar`
- `entidade.destruir`
- `espaco.movimento`

### 5. Cadeia de comportamento
Um comportamento é composição, não um comando monolítico:

```text
QUANDO evento
  [SE condição]
  ENTÃO ação 1
        ação 2
        ...
```

## Extensão proposta do Goodle IR
O formato base de `GoodleIRNode` continua válido. Comportamentos são representados pela árvore de `filhos`, evitando criar um segundo IR.

Exemplo conceitual:

```json
{
  "semantica": "comportamento.reacao.quando",
  "familia": "comportamento",
  "parametros": {
    "evento": "evento.toque",
    "fonte": "heroi",
    "alvo": "inimigo"
  },
  "filhos": [
    {
      "semantica": "dados.valor.diminuir",
      "familia": "comportamento",
      "parametros": {
        "entidade": "heroi",
        "propriedade": "vida",
        "valor": 10
      }
    }
  ]
}
```

## Sintaxe OldRewrite V1 proposta
Forma PT-BR:

```text
quando heroi tocar inimigo:
  diminuir vida de heroi em 10
```

Forma EN equivalente:

```text
when heroi touches inimigo:
  decrease vida of heroi by 10
```

Mistura permitida:

```text
quando heroi touches inimigo:
  decrease vida de heroi em 10
```

A sintaxe superficial pode variar; todas devem convergir para a mesma intenção quando a equivalência estiver declarada no Semantic Dictionary.

## Estado de entidade necessário
Para provar o slice, RuntimeMemoria poderá evoluir de:

```text
entidade = nome + tipo + posição
```

para:

```text
entidade = nome + tipo + posição + propriedades
```

Exemplo:

```json
{
  "nome": "heroi",
  "tipo": "personagem",
  "propriedades": {
    "vida": 100
  }
}
```

O modelo não pressupõe que todo runtime armazene propriedades dessa forma; isso é apenas o adaptador de memória.

## Contrato de eventos do runtime
O HyperKernel continua sem conhecer Phaser/Godot/BYOND/RPG Maker.

O runtime passa a poder registrar comportamentos e receber ocorrências de eventos através de uma abstração Goodle. Conceitualmente:

```ts
registrar(comportamento)
emitir(evento)
```

A API TypeScript final será decidida no plano de implementação e coberta por testes antes do código.

## Equivalências das engines de referência

### Phaser-like
Eventos/callbacks e colisões podem alimentar `evento.*` e `comportamento.reacao.quando` conforme contexto.

### Godot-like
`signal` pode representar emissão/assinatura contextual. A equivalência deve continuar marcada como contextual, não direta por padrão.

### BYOND-like
`proc` é mais amplo que evento; `verb` representa ação exposta ao usuário. Ambos só convergem quando a intenção concreta justificar o ID Goodle correspondente.

### RPG-Maker-like
`event`, event page e common event têm semânticas próprias. O Goodle pode representar gatilho/condição/ações equivalentes sem declarar que uma página de evento é simplesmente uma função ou signal.

## Block-code e low-code
A mesma árvore IR permite blocos visuais:

```text
[QUANDO] [heroi] [TOCAR] [inimigo]
    ↓
[DIMINUIR] [vida] [de heroi] [10]
```

O editor visual não terá uma linguagem paralela: ele produz a mesma árvore Goodle IR.

## Vibecoding / GAIC
Uma intenção como:

```text
quando o heroi bater no inimigo ele perde 10 de vida
```

pode ser interpretada por GAIC para a mesma árvore IR. GAIC não executa diretamente a engine; produz/edita Goodle IR sujeito ao mesmo Semantic Bridge e validação.

## Diagnósticos obrigatórios
O sistema deve rejeitar ou diagnosticar, sem adivinhar:
- entidade referenciada inexistente quando o runtime exigir existência;
- evento desconhecido;
- propriedade inexistente quando não houver política de criação implícita;
- ação sem parâmetros suficientes;
- equivalência contextual sem origem/contexto suficiente;
- runtime que não suporte a capacidade solicitada.

## Primeiro vertical slice
Entrada:

```text
criar personagem heroi
criar personagem inimigo
definir vida de heroi como 100
quando heroi tocar inimigo:
  diminuir vida de heroi em 10
```

A prova V1 deve:
1. parsear para Goodle IR;
2. validar semanticamente;
3. registrar o comportamento no runtime;
4. emitir programaticamente `evento.toque` entre `heroi` e `inimigo`;
5. executar a ação registrada;
6. observar `vida = 90`;
7. não conter imports específicos de Phaser/Godot/BYOND/RPG Maker no parser ou HyperKernel.

## Fora do escopo deste marco
- física real de colisão;
- loop gráfico;
- editor visual final;
- geração por LLM/GAIC completa;
- multiplayer/rede;
- sistema completo de RPG Maker;
- reprodução de signals Godot;
- reprodução de proc/verb BYOND;
- adaptador Phaser real;
- HEPGA definitivo.

## Critério de sucesso
O modelo está arquiteturalmente provado quando o mesmo Goodle IR consegue representar e executar o primeiro comportamento reativo em RuntimeMemoria, preservando independência de engine e deixando interfaces adequadas para futuros adaptadores.
