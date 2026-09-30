import { describe, expect, it } from "vitest";
import { addSemanticNode, addSemanticRelation, createSemanticGraph } from "../grafo/SemanticGraph";
import { semanticGraphToHom } from "../hom/HnkObjectModel";
import { homToHnkIR } from "../hnkir/HnkIR";
import { hnkIRToVersePlan } from "./HnkVerseAdapter";

const addNode = (graph: ReturnType<typeof createSemanticGraph>, id: string, semantic_id: string, kind: "structure" | "data" | "behavior") =>
  addSemanticNode(graph, { id, semantic_id, kind, authority: "VALIDATED", provenance_refs: ["intent-connected"], attributes: {} });

describe("connected HNK-VERSE model", () => {
  it("preserves typed relations end-to-end", () => {
    let graph = createSemanticGraph("graph-connected");
    graph = addNode(graph, "world", "estrutura.mundo", "structure");
    graph = addNode(graph, "entity", "estrutura.entidade", "structure");
    graph = addNode(graph, "property", "dados.propriedade", "data");
    graph = addNode(graph, "event", "comportamento.evento", "behavior");
    graph = addNode(graph, "action", "comportamento.acao", "behavior");

    graph = addSemanticRelation(graph, { id: "r-world-entity", source: "world", target: "entity", relation: "contains", authority: "VALIDATED", provenance_refs: ["intent-connected"] });
    graph = addSemanticRelation(graph, { id: "r-entity-property", source: "entity", target: "property", relation: "defines", authority: "VALIDATED", provenance_refs: ["intent-connected"] });
    graph = addSemanticRelation(graph, { id: "r-event-action", source: "event", target: "action", relation: "triggers", authority: "VALIDATED", provenance_refs: ["intent-connected"] });

    const hom = semanticGraphToHom(graph);
    const ir = homToHnkIR(hom);
    const verse = hnkIRToVersePlan(ir);

    expect(hom.relations).toHaveLength(3);
    expect(ir.relations).toHaveLength(3);
    expect(verse.relations.map((relation) => relation.relation)).toEqual(["contains", "defines", "triggers"]);
    expect(verse.relations[0]).toMatchObject({ source_operation: "verse-world", target_operation: "verse-entity" });
    expect(verse.relations[2]).toMatchObject({ source_operation: "verse-event", target_operation: "verse-action" });
  });
});
