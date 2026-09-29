# Goodle Behavior/Event Model V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Executar o primeiro comportamento reativo Goodle: criar herói/inimigo, definir vida=100, registrar `quando heroi tocar inimigo`, emitir `evento.toque` e observar vida=90.

**Architecture:** Estender o Semantic Dictionary e o parser OldRewrite sem criar um segundo IR. `GoodleIRNode.filhos` representa ações reativas; HyperKernel continua engine-agnostic e RuntimeMemoria ganha propriedades, registro de comportamentos e emissão de eventos.

**Tech Stack:** TypeScript, Vitest, Goodle IR V1, Semantic Dictionary V1, HyperKernel, RuntimeMemoria.

**Spec:** `docs/arquitetura/GOODLE-BEHAVIOR-EVENT-MODEL-V1.md`

## Global Constraints
- Entrada aceita PT-BR com/sem acentos, inglês ou mistura quando equivalência estiver declarada.
- Parser e HyperKernel não podem importar Phaser, Godot, BYOND ou RPG Maker.
- Signal/callback/proc/verb/event são equivalências contextuais quando aplicável, não identidades técnicas.
- Block-code, low-code, OldRewrite e GAIC devem convergir para o mesmo Goodle IR.
- Sem fallback silencioso para evento, propriedade, entidade ou capacidade desconhecida.
- CI atual está bloqueado antes dos steps; registrar código/testes não equivale a GREEN.

## Review Focus
- Bloco `quando` sem ação filha deve produzir diagnóstico, não comportamento vazio silencioso — Task 3.
- Valor não numérico em `definir/diminuir` deve falhar no parser — Task 2.
- Emissão para entidades inexistentes deve retornar diagnóstico/resultado explícito — Task 4.
- Propriedade inexistente em `diminuir` não deve ser criada implicitamente — Task 4.
- Evento desconhecido não deve ser registrado nem emitido silenciosamente — Tasks 1 e 4.

---

### Task 1: Vocabulário semântico reativo

**Files:**
- Modify: `src/nucleo/semantica/DicionarioSemantico.ts`
- Test: `src/nucleo/semantica/DicionarioSemantico.test.ts`

**Interfaces:**
- Consumes: `resolverTermoSemantico(termo, origem?)`.
- Produces: IDs `evento.toque`, `dados.valor.definir`, `dados.valor.diminuir` e aliases PT-BR/EN declarados.

- [ ] **Step 1: Write the failing tests**
  - `resolverTermoSemantico("tocar")?.idCanonico === "evento.toque"`
  - `resolverTermoSemantico("touch")?.idCanonico === "evento.toque"`
  - `resolverTermoSemantico("diminuir")?.idCanonico === "dados.valor.diminuir"`
  - termo de evento desconhecido retorna `undefined`.

- [ ] **Step 2: Run the focused semantic tests**
  Run: `npm test -- src/nucleo/semantica/DicionarioSemantico.test.ts`
  Expected when runner works: new assertions FAIL before implementation.

- [ ] **Step 3: Add the minimal canonical entries and aliases**
  Modify only `DicionarioSemantico.ts`; preserve existing normalization/origin rules.

- [ ] **Step 4: Run focused tests**
  Expected: PASS when executable infrastructure is available; otherwise record CI BLOCKED.

- [ ] **Step 5: Commit**
  `git commit -m "feat: adiciona semantica de eventos e valores"`

### Task 2: Parser de propriedades e bloco `quando`

**Files:**
- Modify: `src/nucleo/oldrewrite/ParserOldRewrite.ts`
- Test: `src/nucleo/oldrewrite/ParserOldRewrite.behavior.test.ts`

**Interfaces:**
- Consumes: `criarNoSemantico(...)`, IDs da Task 1.
- Produces: `parseOldRewrite(fonte): GoodleIRPrograma` com árvore reativa em `filhos`.

- [ ] **Step 1: Write failing parser tests**
  Cobrir exatamente:
  - `definir vida de heroi como 100` → `dados.valor.definir` com `{ entidade:"heroi", propriedade:"vida", valor:100 }`;
  - `quando heroi tocar inimigo:` + linha indentada `diminuir vida de heroi em 10` → nó `comportamento.reacao.quando` com `evento:"evento.toque"`, fonte/alvo e um filho `dados.valor.diminuir`;
  - `when heroi touches inimigo:` + `decrease vida of heroi by 10` converge para a mesma semântica;
  - forma mista converge para a mesma semântica;
  - valor não numérico lança `ErroParserOldRewrite` com linha/texto.

- [ ] **Step 2: Run focused parser tests**
  Run: `npm test -- src/nucleo/oldrewrite/ParserOldRewrite.behavior.test.ts`
  Expected: FAIL before implementation when runner works.

- [ ] **Step 3: Implement minimal block-aware parsing**
  Manter comandos existentes. Reconhecer `quando/when` como início de bloco e anexar somente linhas indentadas imediatamente seguintes como `filhos`.

- [ ] **Step 4: Run parser tests plus existing OldRewrite tests**
  Run: `npm test -- src/nucleo/oldrewrite`
  Expected: PASS when runner works; no regressions nos slices criação/posição/movimento.

- [ ] **Step 5: Commit**
  `git commit -m "feat: parseia propriedades e comportamentos reativos"`

### Task 3: Validação semântica de comportamento

**Files:**
- Modify: `src/nucleo/ir/validarGoodleIR.ts`
- Test: `src/nucleo/ir/validarGoodleIR.behavior.test.ts`

**Interfaces:**
- Consumes: árvore produzida pela Task 2.
- Produces: diagnósticos adicionais `COMPORTAMENTO_SEM_ACAO` e `PARAMETRO_OBRIGATORIO_AUSENTE` sem remover diagnósticos V1 existentes.

- [ ] **Step 1: Write failing validation tests**
  Cobrir `quando` sem filhos, `evento.toque` sem fonte/alvo e `dados.valor.diminuir` sem entidade/propriedade/valor; caminhos devem apontar ao nó/parâmetro correto.

- [ ] **Step 2: Run focused validator tests**
  Run: `npm test -- src/nucleo/ir/validarGoodleIR.behavior.test.ts`
  Expected: FAIL before implementation when runner works.

- [ ] **Step 3: Extend `DiagnosticoIR` and recursive validation minimally**
  Validar apenas requisitos fixados pela spec deste slice; não criar schema genérico completo.

- [ ] **Step 4: Run all IR validation tests**
  Run: `npm test -- src/nucleo/ir/validarGoodleIR`
  Expected: PASS when runner works.

- [ ] **Step 5: Commit**
  `git commit -m "feat: valida comportamentos reativos no Goodle IR"`

### Task 4: RuntimeMemoria reativo

**Files:**
- Modify: `src/runtime/memoria/RuntimeMemoria.ts`
- Test: `src/runtime/memoria/RuntimeMemoria.behavior.test.ts`

**Interfaces:**
- Consumes: `GoodleIRNode` reativo validado.
- Produces: `registrar(comportamento: GoodleIRNode): ResultadoExecucao`, `emitir(evento: EventoRuntimeGoodle): ResultadoEventoGoodle`, estado de propriedades observável via `entidades()`.

Define:
- `EventoRuntimeGoodle = { semantica: string; fonte: string; alvo?: string }`.
- `ResultadoEventoGoodle` deve distinguir `executado`, `evento_desconhecido`, `entidade_nao_encontrada` e `propriedade_nao_encontrada`.

- [ ] **Step 1: Write failing runtime tests**
  Cobrir: definir vida=100; registrar reação de toque; emitir toque e chegar a 90; emitir para entidade inexistente; diminuir propriedade inexistente sem criá-la; evento desconhecido sem executar ações.

- [ ] **Step 2: Run focused runtime tests**
  Run: `npm test -- src/runtime/memoria/RuntimeMemoria.behavior.test.ts`
  Expected: FAIL before implementation when runner works.

- [ ] **Step 3: Extend entity state with `propriedades?: Record<string, number>`**
  `entidades()` continua retornando cópia defensiva, agora incluindo propriedades.

- [ ] **Step 4: Implement `registrar` and `emitir` with exact signatures above**
  Match de `evento.toque` exige semântica + fonte + alvo; ações filhas são executadas somente após match.

- [ ] **Step 5: Run runtime tests**
  Run: `npm test -- src/runtime/memoria`
  Expected: PASS when runner works.

- [ ] **Step 6: Commit**
  `git commit -m "feat: adiciona eventos e propriedades ao RuntimeMemoria"`

### Task 5: Integração HyperKernel sem conhecimento de engine

**Files:**
- Modify: `src/runtime/HyperKernel.ts`
- Test: `src/runtime/HyperKernel.behavior.test.ts`

**Interfaces:**
- Consumes: runtime reativo da Task 4 e `validarGoodleIR` da Task 3.
- Produces: despacho inicial que registra `comportamento.reacao.quando` no runtime capaz de registrá-lo, sem imports de engines concretas.

- [ ] **Step 1: Write failing HyperKernel tests**
  Confirmar que comportamento válido é registrado, IR inválido não é registrado e runtime sem capacidade retorna `nao_suportado` sem fallback.

- [ ] **Step 2: Run focused HyperKernel tests**
  Run: `npm test -- src/runtime/HyperKernel.behavior.test.ts`
  Expected: FAIL before implementation when runner works.

- [ ] **Step 3: Add the smallest runtime capability contract needed for registration**
  Preferir capability opcional no contrato universal; não importar `RuntimeMemoria` no HyperKernel.

- [ ] **Step 4: Run HyperKernel tests**
  Run: `npm test -- src/runtime/HyperKernel`
  Expected: PASS when runner works.

- [ ] **Step 5: Commit**
  `git commit -m "feat: registra comportamentos pelo HyperKernel"`

### Task 6: Prova ponta a ponta Behavior/Event V1

**Files:**
- Create: `src/nucleo/ir/GoodleIR.behavior.e2e.test.ts`
- Modify: `docs/arquitetura/GOODLE-BEHAVIOR-EVENT-MODEL-V1.md` somente para status/evidência após implementação.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: prova única do vertical slice especificado.

- [ ] **Step 1: Write the E2E test using the exact spec program**
  Parsear quatro linhas da spec, validar sem diagnósticos, executar programa pelo HyperKernel, emitir `{ semantica:"evento.toque", fonte:"heroi", alvo:"inimigo" }`, afirmar `vida === 90`.

- [ ] **Step 2: Add architectural assertions**
  O teste/review deve confirmar ausência de imports Phaser/Godot/BYOND/RPG Maker em `ParserOldRewrite.ts` e `HyperKernel.ts`.

- [ ] **Step 3: Run focused E2E**
  Run: `npm test -- src/nucleo/ir/GoodleIR.behavior.e2e.test.ts`
  Expected: PASS quando houver runner executável.

- [ ] **Step 4: Run full verification gate**
  Run: `npm test && npm run check && npm run build`
  Expected: todos PASS. Se Actions continuar falhando antes dos steps, registrar `CI BLOCKED / NÃO GREEN` e não promover.

- [ ] **Step 5: Update spec status with actual evidence only**
  Nunca escrever GREEN sem saída verificável do gate anterior.

- [ ] **Step 6: Commit**
  `git commit -m "test: prova Behavior Event Model V1 ponta a ponta"`

## Self-review
- Spec coverage: evento, gatilho, ação, propriedades, PT-BR/EN/mix, RuntimeMemoria, emissão programática, diagnósticos e independência de engine estão atribuídos às Tasks 1–6.
- Step scan: cada tarefa mantém ciclo RED → implementação mínima → verificação → commit.
- Type consistency: `GoodleIRNode.filhos` permanece a única árvore IR; não foi criado segundo modelo intermediário.
- Review Focus: os cinco riscos estão cobertos explicitamente nas Tasks 1–4.
- Proportion/YAGNI: física real, adaptadores concretos, editor visual, GAIC completo, multiplayer e HEPGA permanecem fora do plano conforme a spec.
