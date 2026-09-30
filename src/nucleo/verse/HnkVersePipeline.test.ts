import { describe, expect, it } from "vitest";
import { addSemanticNode, createSemanticGraph } from "../grafo/SemanticGraph";
import { semanticGraphToHom } from "../hom/HnkObjectModel";
import { homToHnkIR } from "../hnkir/HnkIR";
import { hnkIRToVersePlan } from "./HnkVerseAdapter";

describe("HOM → HNK-IR → HNK-VERSE", () => {
  it("lowers a world while preserving source identity and provenance", () => {
    let graph = createSemanticGraph("graph-world");
    graph = addSemanticNode(graph, {
      id: "world-1",
      semantic_id: "estrutura.mundo",
      kind: "structure",
      authority: "VALIDATED",
      provenance_refs: ["intent-world"],
      attributes: { name: "Abra's Island" },
    });

    const hom = semanticGraphToHom(graph);
    const ir = homToHnkIR(hom);
    const verse = hnkIRToVersePlan(ir);

    expect(ir.nodes[0]).toMatchObject({ id: "world-1", kind: "WORLD" });
    expect(verse.operations[0]).toMatchObject({ operation: "world", source_ir: "world-1" });
    expect(verse.operations[0].provenance_refs).toContain("intent-world");
  });

  it("does not lower unresolved semantics into Verse operations", () => {
    let graph = createSemanticGraph("graph-unknown");
    graph = addSemanticNode(graph, {
      id: "unknown-1",
      semantic_id: "conceito.desconhecido",
      kind: "knowledge",
      authority: "UNRESOLVED",
      provenance_refs: [],
      attributes: {},
    });
    const verse = hnkIRToVersePlan(homToHnkIR(semanticGraphToHom(graph)));
    expect(verse.operations).toEqual([]);
    expect(verse.unresolved).toEqual(["unknown-1"]);
  });
});
