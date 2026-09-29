# G0.1 — GoodProject Core Model

## Status

**IMPLEMENTAÇÃO INICIAL**

## Objetivo

Criar o primeiro modelo estruturado de projeto do Goodle para que componentes, cenas, regras e intenção possam ser representados sem depender da interface visual.

## Modelo

Um `GoodProjeto` contém:

- identidade;
- nome;
- versão;
- ambiente;
- intenção;
- componentes;
- cenas;
- regras;
- metadados.

## Composição

A composição ocorre pelo registro de componentes e pelas funções de adição de componentes.

## Registro

O `RegistroComponentes` permite:

- registrar;
- consultar;
- listar;
- instanciar componentes.

## Componentes base iniciais

- Painel;
- Personagem;
- Movimento;
- Vida;
- Inventário;
- Diálogo.

Eles são apenas componentes de fundação. Não são ainda sistemas completos de produção.

## Validação

O projeto possui uma validação inicial que verifica:

- identidade;
- nome;
- intenção;
- ids duplicados;
- referências de cena.

## Próxima evolução

Conectar o GoodStudio ao GoodProject para que os componentes selecionados na interface alterem um projeto real.
