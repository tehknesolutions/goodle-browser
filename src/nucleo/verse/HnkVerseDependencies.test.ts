import { describe, expect, it } from "vitest";
import type { HnkVersePlan } from "./HnkVerseAdapter";
import { buildVerseDependencyGraph, orderVerseOperationsByDependencies } from "./HnkVerseDependencyGraph";

const operation = (id: string, kind: "world" | "entity" | "property" | "event" | "action") => ({
  operation_id: `verse-${id}`,
  operation: kind,
  source_ir: id,
  payload: {},
  provenance_refs: [],
});

const relation = (id: string, source: string, target: string, kind: "contains" | "defines" | "triggers") => ({
  id,
  source,
  target,
  relation: kind,
  authority: "VALIDATED" as const,
  provenance_refs: [],
  source_operation: `verse-${source}`,
  target_operation: `verse-${target}`,
});

describe("HNK-VERSE dependency graph", () => {
  it("derives structural and behavioral execution dependencies", () => {
    const plan: HnkVersePlan = {
      schema: "goodle-hnk-verse-plan/v0.1",
      source_hnkir: "hom-1",
      operations: [operation("action", "action"), operation("property", "property"), operation("entity", "entity"), operation("world", "world"), operation("event", "event")],
      relations: [
        relation("r1", "world", "entity", "contains"),
        relation("r2", "entity", "property", "defines"),
        relation("r3", "event", "action", "triggers"),
      ],
      unresolved: [],
    };
    const graph = buildVerseDependencyGraph(plan);
    expect(graph.dependencies.find((item) => item.operation_id === "verse-entity")?.depends_on).toEqual(["verse-world"]);
    expect(graph.dependencies.find((item) => item.operation_id === "verse-property")?.depends_on).toEqual(["verse-entity"]);
    expect(graph.dependencies.find((item) => item.operation_id === "verse-action")?.depends_on).toEqual(["verse-event"]);
    const ordered = orderVerseOperationsByDependencies(plan).map((item) => item.operation_id);
    expect(ordered.indexOf("verse-world")).toBeLessThan(ordered.indexOf("verse-entity"));
    expect(ordered.indexOf("verse-entity")).toBeLessThan(ordered.indexOf("verse-property"));
    expect(ordered.indexOf("verse-event")).toBeLessThan(ordered.indexOf("verse-action"));
  });

  it("rejects cyclic execution dependencies", () => {
    const plan: HnkVersePlan = {
      schema: "goodle-hnk-verse-plan/v0.1",
      source_hnkir: "hom-cycle",
      operations: [operation("world", "world"), operation("entity", "entity")],
      relations: [relation("r1", "world", "entity", "contains"), relation("r2", "entity", "world", "contains")],
      unresolved: [],
    };
    expect(() => orderVerseOperationsByDependencies(plan)).toThrow("CYCLE");
  });
});
