# M83 — Geometry and Shape Model

## Canonical contract

Geometry is logical state attached to entities. It is independent from rendering and physics engines.

Shapes:
- `geometria.ponto`
- `geometria.circulo` with `raio`
- `geometria.retangulo` with `largura` and `altura`

Collision rules:
- circle-circle: center distance <= sum of radii;
- rectangle-rectangle: axis-aligned overlap by half-extents;
- point inside circle: point distance <= radius;
- point inside rectangle: point coordinates within half-extents.

If no explicit geometry exists, M82's legacy distance thresholds remain as compatibility fallback.

## Acceptance

- parser creates explicit geometry state;
- IR validates required shape parameters;
- RuntimeMemoria exposes geometry;
- M82 relations become shape-aware when geometry exists;
- queries remain deterministic and side-effect free;
- no engine-specific physics/rendering dependency enters the core.
