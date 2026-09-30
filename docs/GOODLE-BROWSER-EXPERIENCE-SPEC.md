# Goodle Browser — Functional Experience Spec

## Goal
Transform the current technical prototype into the Goodle Browser product surface: visually aligned with the approved Goodle direction, navigable, creation-first, with FunSpace, functional Alef input, contextual Good AI, and the official Goodle identity.

## Product boundary
Goodle Browser owns the creation experience, GoodStudio, FunSpace, project surfaces, intent capture, compilation/orchestration, manifestation preview/runtime surfaces and project-context AI interactions.

HNK-VERSE is not embedded in Goodle Browser. It is an optional external target reached through explicit interop/contracts. HNK-KODE and CODEX-HNK remain integrations according to their contracts rather than being silently absorbed into the Browser.

`Assets` is not a canonical top-level Browser module. `Chronicle` is not a canonical top-level Browser module and must not appear as a primary navigation destination merely because prototype code exists for it.

## Information architecture

### Global shell
- Official Goodle symbol/icon at the left of the header.
- Lowercase `goodle®` wordmark and `Browser` product label.
- Central Alef command/input surface.
- Project/runtime controls at the right.
- GoodStudio and FunSpace are first-class spaces, not decorative buttons.

### GoodStudio
Creation and construction workspace. Existing project domains remain accessible where supported: Início, Interface, Mundo, Componentes, Dados, Lógica, Backend and Segurança.

### FunSpace
A first-class creative/exploratory space for playing, exploring, testing and manifesting creations. It has its own selected state and content surface; selecting it must change the workspace rather than only changing button styling.

### Manifestation surface
The center of the experience is the result/workspace, not raw implementation detail. Game/world content can mount Phaser here. Other creation types can use appropriate React renderers.

## Alef input
The global creation bar is an intent interface, not fake search.

Submitting an intention must:
1. capture the text;
2. create a visible processing state;
3. send the intention into the Goodle creation/compile boundary that exists in the repository;
4. surface a result or an explicit unsupported/error state;
5. update the workspace rather than silently doing nothing.

No UI may claim HNK-VERSE execution unless an external HNK-VERSE target is actually connected and execution was requested.

## Good AI
Good AI is contextual to the active project/workspace. The first functional slice must:
- accept a user message;
- retain the conversation in UI state for the current session;
- expose project/workspace context to its orchestration boundary;
- show pending, success, unsupported and error states;
- never pretend a remote AI provider answered when no provider is connected.

A provider adapter boundary must allow a real AI backend/plugin to be connected later without rewriting the UI.

## Navigation behavior
Every visible navigation control must do one of three things: open a real surface, perform a real action, or be visibly disabled with an explanation. No dead buttons.

GoodStudio/FunSpace switching changes the main workspace. Project section selection changes the selected section and its visible content. Execute invokes only a supported local/runtime action and reports unsupported capabilities explicitly.

## Brand direction
Use the approved Goodle identity direction:
- lowercase `goodle`;
- Goodle geometric G/portal symbol;
- registered-mark treatment `goodle®` in the product wordmark;
- dark, mature interface rather than childish or excessively gloomy;
- dark red/pomegranate, dark green and gold as supporting palette, with the established Goodle energy accents where appropriate;
- icon used consistently in the header and favicon/app identity.

The registered-mark glyph is a brand treatment requested by the product owner; this spec does not make a legal claim about registration status in any jurisdiction.

## Visual hierarchy
The product should resemble a polished creation browser/workspace, not a generic three-column IDE prototype. The Alef surface and manifestation workspace have visual priority. Technical IR/debug views are secondary and may be exposed contextually rather than dominating the default screen.

## Interaction states
All asynchronous/command interactions need idle, pending, success, unsupported and error states. Keyboard submission must work for the Alef input. Focus states and accessible labels are required for primary controls.

## Responsive behavior
Desktop is the primary target for this milestone. Narrow layouts must remain usable without overlapping or disappearing primary actions; panels may collapse/reflow.

## Acceptance criteria
- Header shows Goodle icon and `goodle® Browser`.
- GoodStudio and FunSpace both switch to distinct real workspace surfaces.
- No top-level Assets or Chronicle destination.
- Project navigation changes visible content and has no dead buttons.
- Alef submission produces a visible state/result through a real local orchestration boundary.
- Good AI accepts messages and truthfully reports provider availability/results.
- Execute has real behavior or an explicit unsupported state.
- Default workspace prioritizes manifestation/creation over raw IR.
- Phaser has a defined mount surface for interactive/game manifestations.
- HNK-VERSE remains external and is never presented as embedded.
- Brand/favicon treatment is present.
