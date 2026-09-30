import { describe, expect, it } from "vitest";
import { addSemanticNode, addSemanticRelation, createSemanticGraph } from "./SemanticGraph";

const node = (id: string, semantic_id: string) => ({
  id,
  semantic_id,
  kind: "structure" as const,
  authority: "VALIDATED" as const,
  provenance_refs: [],
  attributes: {},
});

describe("Goodle Semantic Graph v0.2", () => {
  it("preserves semantic identity independently from labels", () => {
    let graph = createSemanticGraph("graph-1");
    graph = addSemanticNode(graph, { ...node("n1", "WORLD"), label: "Mundo" });
    expect(graph.nodes[0].semantic_id).toBe("WORLD");
    expect(graph.nodes[0].label).toBe("Mundo");
  });

  it("rejects relations whose endpoints are unresolved", () => {
    const graph = addSemanticNode(createSemanticGraph("graph-2"), node("n1", "WORLD"));
    expect(() => addSemanticRelation(graph, {
      id: "r1",
      source: "n1",
      target: "missing",
      relation: "contains",
      authority: "VALIDATED",
      provenance_refs: [],
    })).toThrow("UNRESOLVED");
  });

  it("creates typed semantic relations without changing node identities", () => {
    let graph = createSemanticGraph("graph-3");
    graph = addSemanticNode(graph, node("world", "WORLD"));
    graph = addSemanticNode(graph, node("entity", "ENTITY"));
    graph = addSemanticRelation(graph, {
      id: "contains-1",
      source: "world",
      target: "entity",
      relation: "contains",
      authority: "VALIDATED",
      provenance_refs: [],
    });
    expect(graph.relations[0]).toMatchObject({ source: "world", target: "entity", relation: "contains" });
    expect(graph.nodes.map((item) => item.semantic_id)).toEqual(["WORLD", "ENTITY"]);
  });
});
