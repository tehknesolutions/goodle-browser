# Goodle Change/Checkpoint Protocol

Every implementation task should use a structured change request.

## Input

[TIPO(ESCOPO)]: DESCRIÇÃO

Technical instructions:
- objective
- constraints
- affected areas
- invariants to preserve
- acceptance criteria

## Executor output

FASE N: CHANGELOG

Required:
- timestamp
- requested type/scope
- files/components changed
- exact impact
- tests/validation
- known limitations

## Checkpoint

A change becomes a stable process checkpoint only after validation.

## Regression rule

If an implementation breaks previously validated behavior, prefer:
- rollback/revert
- isolated FIX
- explicit architecture decision

Do not silently rewrite history or functionality.
