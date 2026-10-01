# M91 — Physics Wake Events and Island Activation

## Canonical contract

M91 adds deterministic wake propagation through connected persistent-contact islands.

An island is a connected component of the persistent-contact graph. Entity names are the stable ordering key and island IDs are deterministic member-name joins.

Wake activation resets sleep state and resting counters for non-blocked members of the affected island. Blocked/static bodies remain blocked.

When persistent contacts disappear, recalculation splits the graph deterministically.

## Acceptance

- stable island calculation;
- observable/serializable island state;
- wake propagation through connected contacts;
- deterministic split after contact removal;
- blocked-body handling;
- M90 compatibility;
- no external engine dependency.
