import { describe, expect, it } from "vitest";
import { addSemanticNode, createSemanticGraph } from "../grafo/SemanticGraph";
import { semanticGraphToHom } from "../hom/HnkObjectModel";
import { homToHnkIR } from "../hnkir/HnkIR";
import { hnkIRToVersePlan } from "./HnkVerseAdapter";
import { createVerseExecutionReceipt, orderVerseOperations } from "./HnkVerseExecutionContract";

const semanticNodes = [
  ["world-1", "estrutura.mundo", "structure"],
  ["entity-1", "estrutura.entidade", "structure"],
  ["property-1", "dados.propriedade", "data"],
  ["event-1", "comportamento.evento", "behavior"],
  ["action-1", "comportamento.acao", "behavior"],
] as const;

describe("HNK-VERSE vertical slice", () => {
  it("lowers WORLD → ENTITY → PROPERTY → EVENT → ACTION in deterministic order", () => {
    let graph = createSemanticGraph("graph-vertical");
    for (const [id, semantic_id, kind] of semanticNodes) {
      graph = addSemanticNode(graph, {
        id,
        semantic_id,
        kind,
        authority: "VALIDATED",
        provenance_refs: ["intent-vertical"],
        attributes: {},
      });
    }

    const plan = hnkIRToVersePlan(homToHnkIR(semanticGraphToHom(graph)));
    expect(orderVerseOperations(plan).map((item) => item.operation)).toEqual([
      "world", "entity", "property", "event", "action",
    ]);

    const receipt = createVerseExecutionReceipt({
      request_id: "verse-request-1",
      principal: { canonical_id: "human:creator", actor_type: "human" },
      runtime: { canonical_id: "service:hnk-verse", actor_type: "service" },
      plan,
      intent_ref: "intent-vertical",
      requested_at: "2026-09-30T00:00:00Z",
    });

    expect(receipt.status).toBe("accepted");
    expect(receipt.accepted_operations).toHaveLength(5);
  });

  it("rejects execution when unresolved semantics remain", () => {
    let graph = createSemanticGraph("graph-blocked");
    graph = addSemanticNode(graph, {
      id: "unknown-1",
      semantic_id: "unknown.semantic",
      kind: "knowledge",
      authority: "UNRESOLVED",
      provenance_refs: [],
      attributes: {},
    });
    const plan = hnkIRToVersePlan(homToHnkIR(semanticGraphToHom(graph)));
    const receipt = createVerseExecutionReceipt({
      request_id: "verse-request-blocked",
      principal: { canonical_id: "agent:goodle", actor_type: "agent" },
      runtime: { canonical_id: "service:hnk-verse", actor_type: "service" },
      plan,
      requested_at: "2026-09-30T00:00:00Z",
    });
    expect(receipt.status).toBe("rejected");
  });
});
