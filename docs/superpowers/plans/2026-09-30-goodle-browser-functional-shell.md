# Goodle Browser Functional Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing prototype into a navigable Goodle Browser shell with branded identity, real GoodStudio/FunSpace switching, functional Alef intent submission, contextual Good AI local behavior, and truthful runtime states.

**Architecture:** Keep the current React shell and existing compiler/runtime boundaries. Add explicit UI state at EstudioGoodle, make navigation controlled, make Alef update the draft/workspace, and make Good AI a truthful local contextual assistant surface until a remote provider is connected. HNK-VERSE remains external.

**Tech Stack:** React 19, TypeScript, Vite, existing Goodle UI primitives, Phaser mount compatibility.

**Spec:** `docs/GOODLE-BROWSER-EXPERIENCE-SPEC.md`

## Global Constraints
- No top-level Assets or Chronicle destination.
- FunSpace must be a real switchable workspace.
- No dead visible buttons.
- No claim of remote AI or HNK-VERSE execution without a connected provider/target.
- Preserve existing Goodle compiler/runtime code rather than replacing it.

## Review Focus
- Empty Alef input must not create fake work.
- Switching spaces and project sections must visibly change content.
- Good AI must not claim remote inference.
- Execute must expose an honest local/unsupported state.
- Narrow viewport must retain primary controls.

---

### Task 1: Functional shell and brand
**Files:** Modify `src/estudio/EstudioGoodle.tsx`, `src/estudio/componentes/PainelComponentes.tsx`, `src/estilos.css`; create `src/ui/goodle/GoodleMark.tsx`.
- [ ] Add controlled space/section state and Goodle mark/wordmark.
- [ ] Wire GoodStudio/FunSpace and project navigation.
- [ ] Make Execute update a visible runtime state.

### Task 2: Alef and manifestation workspace
**Files:** Modify `src/estudio/EstudioGoodle.tsx`, `src/estudio/componentes/Previa.tsx`.
- [ ] Connect command bar submission to draft natural intent.
- [ ] Show processing/result state and active section/space in center workspace.
- [ ] Preserve a Phaser-compatible manifestation mount.

### Task 3: Good AI first functional slice
**Files:** Modify `src/estudio/componentes/EditorIntencao.tsx`, `src/estudio/EstudioGoodle.tsx`.
- [ ] Accept messages and retain session conversation.
- [ ] Produce truthful local contextual response/provider-unavailable state.
- [ ] Allow Good AI to feed a proposal back into the draft.

### Task 4: Identity polish
**Files:** Modify `src/estilos.css`, `index.html` if required.
- [ ] Mature dark red/pomegranate, dark green, gold supporting treatment.
- [ ] Add favicon/app mark where possible without inventing an unavailable official asset.
- [ ] Ensure responsive layout.
