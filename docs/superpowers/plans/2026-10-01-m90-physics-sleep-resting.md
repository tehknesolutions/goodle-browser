# M90 — Physics Sleeping and Resting State

## Canonical contract

M90 adds deterministic resting/sleep state to physical entities.

A body is considered eligible for sleep when velocity and net acceleration magnitude are below configured thresholds for a deterministic number of simulation steps. Default velocity/force thresholds are `0.01`; default required steps are `3`.

Sleeping bodies are skipped by integration/constraint work until explicitly awakened. Sleep and wake operations are observable, and the resting counter is serializable.

## Acceptance

- deterministic sleep after N qualifying steps;
- explicit wake;
- observable state/counter;
- positive threshold validation;
- no real clock;
- M89 compatibility;
- no external engine dependency.
