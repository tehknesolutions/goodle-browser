# GoodStudio — Mockup Completo e Sintaxe Unificada

## Status

**SPEC PARA REVISÃO — design aprovado em conversa, aguardando revisão deste artefato antes do plano de implementação.**

## 1. Visão

GoodStudio é a superfície de criação do ecossistema Goodle. O objetivo é permitir que a mesma experiência seja criada e refinada por quatro níveis progressivos, sem reconstruir o projeto:

1. Vibe-coding;
2. Low-code;
3. Block-code;
4. OldRewrite / código avançado.

O `GoodProject` permanece como fonte estrutural de verdade. OldRewrite é a linguagem textual oficial e editável do Goodle. TypeScript é a linguagem técnica de manifestação.

## 2. Regra linguística

O produto é **PT-BR first, mas não PT-BR only**.

A sintaxe deve aceitar:

- PT-BR com acentuação;
- PT-BR sem acentuação;
- inglês;
- mistura PT-BR + inglês na mesma expressão.

Exemplos equivalentes:

```oldrewrite
se jogador tem chave:
  abrir portal
```

```oldrewrite
senao:
  mostrar mensagem
```

```oldrewrite
if player tem chave:
  open portal
else:
  show mensagem
```

O parser normaliza aliases para operações canônicas da AST. A grafia digitada pelo criador pode ser preservada para edição/apresentação, mas a semântica interna não depende dela.

Aliases iniciais:

| Canônico | Aliases aceitos |
|---|---|
| quando | quando, when |
| se | se, if |
| senão | senão, senao, else |
| criar | criar, create |
| mostrar | mostrar, show |
| abrir | abrir, open |
| fechar | fechar, close |
| definir | definir, set |
| carregar | carregar, load |
| salvar | salvar, save |

O vocabulário deve ser extensível, não codificado como uma lista fechada no parser.

## 3. Princípio arquitetural

```text
                 GOODPROJECT
              fonte de verdade
                     │
      ┌──────────────┼──────────────┐
      │              │              │
    VIBE           LOW            BLOCK
      │              │              │
      └──────────────┼──────────────┘
                     ↕
                OLDREWRITE
                     ↓
            MANIFESTAÇÃO TS
                     ↓
      ┌──────────────┼──────────────┐
    React          Phaser        Backend
```

React, Phaser e Backend são fundamentos internos do Goodle, não modos separados apresentados ao criador.

## 4. Modelo híbrido de lógica

A superfície é humana; o núcleo é universal.

```text
"se jogador tem chave"
          ↓
Condição(jogador.temChave)
          ↓
 ┌────────┼────────┐
OldRewrite Blocos Low-code
          │
      TypeScript
```

Nós fundamentais:

- Componente;
- Propriedade;
- Estado;
- Evento;
- Condição;
- Ação;
- Dado;
- Serviço;
- Regra.

Block-code não possui uma linguagem independente. É uma projeção visual da AST Goodle.

## 5. Inferência

O Goodle infere por padrão:

- tipo;
- escopo;
- persistência;
- valores iniciais quando explicitados;
- relações simples entre componentes.

Exemplo:

```oldrewrite
criar vida com 100
```

pode resultar em:

```text
nome: vida
tipo: número            [inferido]
escopo: personagem      [inferido]
persistência: sessão    [inferido]
valor: 100
```

Inferências devem possuir proveniência e ser editáveis.

### Política de ambiguidade

1. Sem ambiguidade: executar.
2. Ambiguidade segura e reversível: inferir e marcar.
3. Ambiguidade com consequência relevante ou difícil reversão: perguntar ao criador.

## 6. Estrutura principal do GoodStudio

```text
┌──────────────────────────────────────────────────────────────────────┐
│ GOODLE │ Meu Projeto │ modo atual │ ▶ Executar │ Salvo │ Avatar    │
├──────────────┬──────────────────────────────┬────────────────────────┤
│ PROJETO      │                              │ GOOD — THE AI          │
│              │          PREVIEW             │                        │
│ Início       │                              │ Descreva o que quer    │
│ Interface    │      experiência ao vivo     │ criar ou modificar     │
│ Mundo        │                              │                        │
│ Componentes  ├──────────────────────────────┤ Alterações propostas   │
│ Dados        │                              │ + componente           │
│ Lógica       │         EDITOR ATUAL         │ ~ propriedade          │
│ Backend      │                              │ + fluxo                │
│ Assets       │ OldRewrite / Blocos / Low    │                        │
│ Segurança    │ / Código conforme contexto   │ Aplicar / revisar      │
│ Projeto      │                              │                        │
├──────────────┴──────────────────────────────┴────────────────────────┤
│ GoodRuntime │ React + Phaser + Backend │ erros │ desempenho          │
└──────────────────────────────────────────────────────────────────────┘
```

A interface deve ser responsiva e os painéis devem poder recolher, expandir e trocar de função conforme o modo.

## 7. Tela inicial

A tela inicial prioriza intenção, não configuração técnica.

Elementos:

- campo central “O que você quer criar?”;
- projetos recentes;
- criar projeto vazio;
- templates;
- importar `.hepga`;
- abrir projeto;
- tutorial;
- acesso ao Good — THE AI.

Exemplos de intenção:

- “Crie um RPG 2D com uma cidade e inventário.”
- “Faça um site para minha equipe.”
- “Create a platform game com três fases.”

## 8. Vibe-coding

O GAIC recebe intenção e propõe uma alteração estruturada.

Nunca deve ocultar completamente mudanças relevantes. A interface apresenta um resumo como:

```text
Vou criar:
+ Cena Cidade
+ Personagem
+ Movimento
+ Vida
+ Inventário
+ Banco de dados do jogador
+ Fluxo de entrada

[Aplicar tudo] [Revisar]
```

Depois da aplicação, todos os itens já existem no GoodProject e podem ser editados pelos demais modos.

## 9. Low-code

Visão de componentes e propriedades.

```text
Personagem
├── Aparência
├── Movimento
├── Vida
├── Inventário
├── Dados
└── Eventos
```

Painel de propriedades:

```text
Vida
Valor inicial       100
Máximo              100
Persistência        Sessão     ✨ inferido
Escopo              Personagem ✨ inferido
```

Mudanças atualizam a mesma AST/GoodProject.

## 10. Block-code

Blocos são projeções da lógica Goodle.

```text
[QUANDO jogador entrar na cidade]
                  ↓
       [SE jogador tem chave]
          ↙               ↘
      [SIM]               [NÃO]
        ↓                   ↓
[ABRIR portal]      [MOSTRAR mensagem]
```

Requisitos:

- arrastar/conectar;
- zoom e pan;
- seleção múltipla;
- agrupamento;
- validação visual;
- converter instantaneamente para OldRewrite;
- nenhuma AST paralela exclusiva dos blocos.

## 11. OldRewrite

OldRewrite é a linguagem textual oficial do Goodle.

Exemplo:

```oldrewrite
criar personagem:
  nome: Mig
  vida: 100

quando player entrar na cidade:
  if player tem chave:
    abrir portal
  else:
    show Você precisa da chave.
```

O editor oferece:

- autocomplete multilíngue;
- aliases PT-BR/EN;
- tolerância a acentos;
- diagnóstico inline;
- formatação;
- navegação para componente;
- preview da interpretação;
- destaque de inferências;
- conversão para blocos.

## 12. Código avançado

TypeScript é manifestação avançada.

Regras de round-trip:

1. Alteração representável: sincronizar com GoodProject.
2. Parcialmente representável: sincronizar parte segura e marcar restante.
3. Arbitrária/não representável: preservar como `Código Avançado`.
4. Nunca fingir round-trip sem perda.

## 13. Dados

Tela Dados organiza informação por escopo.

```text
Personagem
├── nome       texto      temporário
├── vida       número     sessão
├── nível      número     persistente
└── moedas     número     persistente

Projeto
└── dificuldade texto     persistente
```

Cada inferência é identificável e editável.

## 14. Backend

Backend deve aparecer como capacidades, não infraestrutura crua.

Blocos iniciais:

- Usuário;
- Perfil;
- Login;
- Banco;
- API;
- Arquivo;
- Evento;
- Tarefa;
- Notificação;
- Integração.

Exemplo:

```text
Login → Perfil → Banco → Inventário → Ranking
```

A visão avançada pode revelar detalhes técnicos quando necessário.

## 15. Assets

Biblioteca única para:

- imagens;
- sprites;
- áudio;
- mapas;
- fontes;
- documentos;
- modelos e outros recursos futuros.

Assets podem ser associados a componentes por arrastar/soltar ou por intenção do GAIC.

## 16. Preview

Preview é contínuo sempre que possível.

Deve suportar:

- executar/pausar;
- reiniciar;
- viewport responsivo;
- estados de carregamento/erro;
- inspeção de componente;
- seleção no preview sincronizada com editor;
- logs simplificados;
- métricas avançadas opcionais.

## 17. Segurança

A superfície de segurança apresenta capacidades concedidas ao projeto:

- rede;
- arquivos;
- persistência;
- autenticação;
- serviços externos;
- recursos do dispositivo.

Princípio: nenhum código gerado recebe capacidade irrestrita por padrão.

## 18. Manifestação técnica

A visão avançada pode mostrar:

```text
Interface / composição      React
Mundo / interação           Phaser
Dados / serviços            Backend TypeScript
Linguagem técnica           TypeScript
Linguagem do criador        OldRewrite
Fonte estrutural            GoodProject
```

Essas informações não são escolhas obrigatórias para o usuário iniciante.

## 19. Navegação progressiva

### Nível 1 — Criar

Vibe-coding + preview.

### Nível 2 — Montar

Low-code + componentes + propriedades.

### Nível 3 — Programar visualmente

Block-code.

### Nível 4 — Escrever

OldRewrite.

### Nível 5 — Avançado

TypeScript e manifestação técnica.

O usuário pode entrar em qualquer nível permitido sem criar outro projeto.

## 20. Fluxo exemplo completo

Intenção:

> “Crie um RPG onde Mig entra numa cidade. Se tiver uma chave abre o portal, senão aparece uma mensagem. Salve moedas e nível.”

GAIC produz:

- Personagem Mig;
- Cena Cidade;
- Dado `chave`;
- Dado `moedas` persistente;
- Dado `nível` persistente;
- Evento de entrada;
- Condição da chave;
- Ação abrir portal;
- Ação mostrar mensagem;
- serviço de persistência.

OldRewrite equivalente:

```oldrewrite
criar personagem:
  nome: Mig

quando Mig entrar na cidade:
  se Mig tem chave:
    abrir portal
  senao:
    mostrar Você precisa da chave.

salvar moedas
save nivel
```

O Block-code, Low-code e TypeScript são outras projeções/manifestações da mesma estrutura.

## 21. Requisitos de UX

- PT-BR first;
- criação sem exigir programação;
- complexidade revelada progressivamente;
- mudanças reversíveis;
- inferências visíveis;
- erros explicados em linguagem humana;
- evitar modais desnecessários;
- ações destrutivas exigem confirmação adequada;
- teclado e mouse como cidadãos de primeira classe;
- mobile/tablet adaptados, sem tentar copiar cegamente o layout desktop.

## 22. Critérios de sucesso do mockup

O mockup será considerado bem-sucedido quando demonstrar visualmente, em um único projeto:

1. criação por intenção;
2. preview;
3. componentes low-code;
4. lógica em blocos;
5. OldRewrite multilíngue/misto;
6. dados e inferência;
7. backend como capacidades;
8. assets;
9. segurança;
10. modo avançado TypeScript;
11. sincronização conceitual entre todas as visões.

## 23. Fora do primeiro mockup

O mockup não precisa implementar ainda:

- navegador UltraRender completo;
- multiplayer real;
- marketplace;
- GoodStore;
- HEP/GoodPoints;
- infraestrutura cloud final;
- compilador OldRewrite completo;
- runtime backend definitivo.

Esses sistemas continuam no PDD geral, mas não devem diluir o primeiro protótipo do GoodStudio.

## 24. Próxima etapa após aprovação desta spec

Criar plano de implementação por fatias verticais, começando por uma experiência demonstrável de ponta a ponta:

`Intenção → GoodProject → OldRewrite → Block-code/Low-code → Preview`.

O primeiro mockup deve provar a unidade do Goodle antes de expandir quantidade de funcionalidades.
