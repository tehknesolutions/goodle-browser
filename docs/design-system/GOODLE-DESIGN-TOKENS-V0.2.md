# GOODLE DESIGN TOKENS V0.2

## 1. Objetivo
Tokens oficiais para transformar a identidade Goodle V0.2 em uma base reutilizável de UI.

Princípio:
primitive → semantic → component → theme.

## 2. Primitive colors
--gold-950: #2A210A
--gold-700: #8F6508
--gold-500: #B8860B
--gold-300: #D4A72C
--gold-100: #F3E4B2

--pomegranate-950: #250A10
--pomegranate-900: #3E0810
--pomegranate-800: #5C0F19
--pomegranate-700: #741827
--pomegranate-500: #8A2635

--red-950: #260B0B
--red-900: #5A0D0D
--red-800: #8B1A1A
--red-700: #A52626
--red-500: #B83A3A

--green-950: #08251C
--green-900: #072A20
--green-800: #0F3D2E
--green-700: #155A43
--green-500: #2B8065

--neutral-950: #050706
--neutral-900: #080A09
--neutral-800: #101412
--neutral-700: #171C19
--neutral-100: #F2F0EA
--neutral-200: #C5C1B8
--neutral-400: #85867F

## 3. Semantic colors
--goodle-intention: var(--gold-500)
--goodle-knowledge: var(--pomegranate-800)
--goodle-action: var(--red-800)
--goodle-manifestation: var(--green-800)

--goodle-canvas: var(--neutral-900)
--goodle-surface: var(--neutral-800)
--goodle-surface-raised: var(--neutral-700)
--goodle-surface-sunken: var(--neutral-950)
--goodle-text: var(--neutral-100)
--goodle-text-secondary: var(--neutral-200)
--goodle-text-muted: var(--neutral-400)
--goodle-border: rgba(214,205,183,.16)

## 4. Functional states
Identity colors and functional state colors remain separate.

--state-success: #22C55E
--state-warning: #F59E0B
--state-error: #EF4444
--state-info: #3B82F6

A domain color must not be interpreted as a functional state automatically.

## 5. Typography
--font-ui: Inter, ui-sans-serif, system-ui, sans-serif
--font-display: Inter, ui-sans-serif, system-ui, sans-serif
--font-code: "JetBrains Mono", "SFMono-Regular", Consolas, monospace

Weights:
--weight-regular: 400
--weight-medium: 500
--weight-semibold: 600
--weight-bold: 700
--weight-extrabold: 800

## 6. Type scale
--text-xs: 12px
--text-sm: 14px
--text-md: 16px
--text-lg: 18px
--text-xl: 20px
--text-2xl: 24px
--text-3xl: 30px
--text-4xl: 36px
--text-5xl: 48px

## 7. Spacing
Base unit: 4px.

--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px

## 8. Radius
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 24px
--radius-pill: 999px

## 9. Borders
--border-width-thin: 1px
--border-width-strong: 2px
--border-color: var(--goodle-border)

Focus:
--focus-width: 2px
--focus-offset: 2px

## 10. Elevation
--shadow-sm: 0 2px 8px rgba(0,0,0,.18)
--shadow-md: 0 8px 24px rgba(0,0,0,.24)
--shadow-lg: 0 16px 48px rgba(0,0,0,.32)

Glow is not elevation. It is an energy treatment.

## 11. Energy
--energy-intention: 0 0 18px rgba(184,134,11,.28)
--energy-knowledge: 0 0 18px rgba(92,15,25,.28)
--energy-action: 0 0 18px rgba(139,26,26,.28)
--energy-manifestation: 0 0 18px rgba(15,61,46,.28)

Energy is reserved for focus, transition, creation and active states.

## 12. Motion
--motion-fast: 140ms
--motion-base: 240ms
--motion-complex: 420ms
--ease-standard: cubic-bezier(.2,.8,.2,1)
--ease-emphasized: cubic-bezier(.16,1,.3,1)

Respect prefers-reduced-motion.

## 13. Component semantics
Command Bar:
--command-accent: var(--goodle-intention)

Knowledge Node:
--knowledge-accent: var(--goodle-knowledge)

Event:
--event-accent: var(--goodle-action)

Action/Behavior:
--action-accent: var(--goodle-action)

Result/Preview:
--result-accent: var(--goodle-manifestation)

Canvas:
--canvas-background: var(--goodle-canvas)

Runtime:
use functional state tokens for operational status.

## 14. Accessibility
Text must remain readable against its surface.
Functional state must not be communicated by color alone.
Interactive focus must remain visible.
Reduced-motion preference must be honored.
The face/logo must have a meaningful accessible label when used as an interactive control.

## 15. Theme
Goodle Dark is the canonical V0.2 theme.
Goodle Light remains a future theme and must not alter semantic meanings.

## 16. Naming rule
Use semantic names in components.
Do not hard-code physical color names into component styles when a semantic token exists.

Correct:
background: var(--goodle-surface)
accent: var(--goodle-intention)

Avoid:
background: #101412
accent: #B8860B
