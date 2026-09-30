import { describe, expect, it } from "vitest";
import type { CapabilityGrant } from "../contratos/HnkEcosystemContracts";
import type { HnkVersePlan } from "./HnkVerseAdapter";
import { authorizeVerseExecution, executionReceiptToEvidence } from "./HnkVerseExecutionEvidence";
import type { VerseExecutionRequest, VerseExecutionReceipt } from "./HnkVerseExecutionContract";

const plan: HnkVersePlan = {
  schema: "goodle-hnk-verse-plan/v0.1",
  source_hnkir: "hom-1",
  operations: [{ operation_id: "verse-world", operation: "world", source_ir: "world", payload: {}, provenance_refs: ["intent-1"] }],
  relations: [],
  unresolved: [],
};

const request: VerseExecutionRequest = {
  request_id: "exec-1",
  principal: { canonical_id: "agent:goodle", actor_type: "agent" },
  runtime: { canonical_id: "service:hnk-verse", actor_type: "service" },
  plan,
  intent_ref: "intent-1",
  project_ref: "project-1",
  requested_at: "2026-09-30T10:00:00Z",
};

const grant: CapabilityGrant = {
  grant_id: "grant-1",
  subject: request.principal,
  capability: "hnk-verse.execute",
  resource_refs: [request.runtime.canonical_id],
  scope: {},
  constraints: {},
  authorized_by: { canonical_id: "human:creator", actor_type: "human" },
  project_ref: "project-1",
  valid_from: "2026-09-30T00:00:00Z",
  valid_until: "2026-10-01T00:00:00Z",
  status: "active",
  redelegable: false,
};

describe("HNK-VERSE execution evidence", () => {
  it("denies execution without a matching capability grant", () => {
    expect(() => authorizeVerseExecution(request, [])).toThrow("CAPABILITY_DENIED");
  });

  it("creates event, evidence and provenance after authorized execution receipt", () => {
    const capability = authorizeVerseExecution(request, [grant]);
    const receipt: VerseExecutionReceipt = {
      request_id: request.request_id,
      runtime: request.runtime,
      status: "executed",
      accepted_operations: ["verse-world"],
      rejected_operations: [],
      executed_at: "2026-09-30T10:00:01Z",
    };
    const bundle = executionReceiptToEvidence(request, receipt, capability);
    expect(bundle.event.causation_refs).toContain("cap-exec-1");
    expect(bundle.evidence).toMatchObject({ classification: "PROCESS_INTEGRITY", truth_assessed: false });
    expect(bundle.provenance.parent_refs).toEqual(["exec-1", "cap-exec-1"]);
    expect(bundle.provenance.authority_state).toBe("OBSERVED");
  });
});
