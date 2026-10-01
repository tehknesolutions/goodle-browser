# M87 — Deterministic Physics Solver Loop

## Canonical contract

M87 unifies M84–M86 into one explicit simulation operation.

Pipeline per `dt`:
1. integrate velocity/position (`fisica.atualizar`);
2. apply world constraints (`fisica.aplicar_regras`);
3. resolve collisions (`resolverColisoes`);
4. repeat collision resolution up to a deterministic iteration cap;
5. apply final constraints with `dt = 0`;
6. return diagnostics.

The default iteration cap is 4. Explicit configuration accepts integer values from 1 through 32.

No real-time clock is consulted by the solver.

## Acceptance

- explicit `dt`;
- deterministic ordering;
- bounded iteration count;
- observable final state and collision diagnostics;
- M84–M86 compatibility;
- no external engine dependency.
