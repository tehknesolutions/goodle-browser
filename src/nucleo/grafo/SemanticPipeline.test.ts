import { describe, expect, it } from "vitest";
import { addSemanticNode, createSemanticGraph } from "./SemanticGraph";
import { executeSemanticPipeline } from "./SemanticPipeline";

describe("Goodle Semantic Pipeline", () => {
  it("preserves identity from Semantic Graph through IR and manifestation", () => {
    let graph = createSemanticGraph("graph-world");
    graph.intent_ref = "intent-world";
    graph = addSemanticNode(graph, {
      id: "world-1",
      semantic_id: "estrutura.mundo",
      kind: "structure",
      label: "Mundo",
      authority: "VALIDATED",
      provenance_refs: ["intent-world"],
      attributes: { name: "Abra's Island" },
    });

    const result = executeSemanticPipeline(graph, {
      manifestation: { kind: "world", adapter: "hnk-verse", version: "0.1" },
    });

    expect(result.intent_ref).toBe("intent-world");
    expect(result.ir.nos[0].id).toBe("world-1");
    expect(result.ir.nos[0].semantica).toBe("estrutura.mundo");
    expect(result.hnk[0]).toMatchObject({ hnk_semantic_id: "WORLD", unresolved: false });
    expect(result.manifestations[0]).toMatchObject({ source_ir: "world-1", kind: "world", adapter: "hnk-verse" });
  });

  it("does not invent an HNK semantic mapping", () => {
    let graph = createSemanticGraph("graph-unknown");
    graph = addSemanticNode(graph, {
      id: "unknown-1",
      semantic_id: "conhecimento.nao-confirmado",
      kind: "knowledge",
      authority: "UNRESOLVED",
      provenance_refs: [],
      attributes: {},
    });

    const result = executeSemanticPipeline(graph);
    expect(result.hnk[0]).toMatchObject({
      source_semantic_id: "conhecimento.nao-confirmado",
      unresolved: true,
    });
  });
});
