# OldRewrite Specification — Proposal v0

## Purpose

OldRewrite is Goodle's human-oriented declarative/behavioral creation language.

## Three conceptual levels

### Level 1 — Declarative

Describe entities and structure.

Example:
create character:
  name: Hero
  health: 100

### Level 2 — Behavioral

Describe reactions and behavior.

Example:
when character touches enemy:
  reduce health by 10

### Level 3 — Systemic

Describe reusable systems, functions, state and more complex computation.

## Design goals

- readable by non-programmers
- deterministic where possible
- translatable to engine operations
- inspectable by GAIC
- versionable
- safe to execute

## Important distinction

OldRewrite describes behavior. It should not become a hidden database of world laws; that responsibility belongs to OldTable.
