import { describe, expect, it } from "vitest";
import { buildChronicle, traceArtifactToIntent } from "./Chronicle";

const identity = { canonical_id: "agent:goodle", actor_type: "agent" as const };
const runtime = { canonical_id: "service:hnk-verse", actor_type: "service" as const };

describe("Goodle Chronicle v0.1", () => {
  it("traces a manifested artifact back to its intent", () => {
    const chronicle = buildChronicle({
      artifact: {
        artifact: { artifact_id: "artifact-1", kind: "world", execution_ref: "exec-1", intent_ref: "intent-1", source_operation_refs: ["verse-world"], authority: "OBSERVED", created_at: "2026-09-30T12:00:02Z", metadata: {} },
        evidence: { evidence_id: "evidence-1", source_ref: "artifact-1", classification: "DESCRIPTIVE", coverage: "COMPLETE_FOR_DECLARED_REQUIREMENTS", truth_assessed: false, causal_claim_permitted: false, metaphysical_proof_permitted: false },
        provenance: { source_id: "prov-1", source_kind: "manifested_artifact", source_ref: "artifact-1", authority_state: "OBSERVED", parent_refs: ["exec-1"], transformations: [] },
      },
      executionRequest: { request_id: "exec-1", principal: identity, runtime, plan: { schema: "goodle-hnk-verse-plan/v0.1", source_hnkir: "graph-1", operations: [], relations: [], unresolved: [] }, intent_ref: "intent-1", requested_at: "2026-09-30T12:00:00Z" },
      executionReceipt: { request_id: "exec-1", runtime, status: "executed", accepted_operations: ["verse-world"], rejected_operations: [] },
      versePlan: { schema: "goodle-hnk-verse-plan/v0.1", source_hnkir: "graph-1", operations: [], relations: [], unresolved: [] },
      hnkIR: { schema: "hnk-ir/goodle-v0.1", hom_ref: "graph-1", nodes: [], relations: [] },
      hom: { schema: "hnk-hom/v0.1", graph_ref: "graph-1", objects: [], relations: [] },
      semanticGraph: { schema: "goodle-semantic-graph/v0.2", graph_id: "graph-1", intent_ref: "intent-1", nodes: [], relations: [], provenance: [] },
    });
    expect(chronicle.complete).toBe(true);
    expect(traceArtifactToIntent(chronicle)).toBe("intent-1");
    expect(chronicle.entries.map((entry) => entry.stage)).toEqual(["artifact", "execution", "verse_plan", "hnk_ir", "hom", "semantic_graph", "intent"]);
  });

  it("reports lineage gaps instead of inventing missing history", () => {
    const chronicle = buildChronicle({
      artifact: {
        artifact: { artifact_id: "artifact-gap", kind: "world", execution_ref: "exec-gap", source_operation_refs: [], authority: "OBSERVED", created_at: "2026-09-30T12:00:00Z", metadata: {} },
        evidence: { evidence_id: "evidence-gap", source_ref: "artifact-gap", classification: "DESCRIPTIVE", coverage: "PARTIAL", truth_assessed: false, causal_claim_permitted: false, metaphysical_proof_permitted: false },
        provenance: { source_id: "prov-gap", source_kind: "manifested_artifact", source_ref: "artifact-gap", authority_state: "OBSERVED", parent_refs: [], transformations: [] },
      },
      executionRequest: { request_id: "exec-gap", principal: identity, runtime, plan: { schema: "goodle-hnk-verse-plan/v0.1", source_hnkir: "unknown", operations: [], relations: [], unresolved: [] }, requested_at: "2026-09-30T12:00:00Z" },
      executionReceipt: { request_id: "exec-gap", runtime, status: "executed", accepted_operations: [], rejected_operations: [] },
    });
    expect(chronicle.complete).toBe(false);
    expect(chronicle.missing).toEqual(["verse_plan", "hnk_ir", "hom", "semantic_graph", "intent"]);
  });
});
