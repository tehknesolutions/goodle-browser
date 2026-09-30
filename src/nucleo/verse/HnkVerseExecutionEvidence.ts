import {
  capabilityMayExecute,
  type CapabilityGrant,
  type CapabilityRequest,
  type EventEnvelope,
  type EvidenceRef,
  type ProvenanceRecord,
} from "../contratos/HnkEcosystemContracts";
import type { VerseExecutionRequest, VerseExecutionReceipt } from "./HnkVerseExecutionContract";

export type VerseExecutionEvidenceBundle = {
  capability_request: CapabilityRequest;
  event: EventEnvelope;
  evidence: EvidenceRef;
  provenance: ProvenanceRecord;
};

export function authorizeVerseExecution(
  request: VerseExecutionRequest,
  grants: readonly CapabilityGrant[],
): CapabilityRequest {
  const capabilityRequest: CapabilityRequest = {
    request_id: `cap-${request.request_id}`,
    subject: request.principal,
    capability: "hnk-verse.execute",
    resource_ref: request.runtime.canonical_id,
    intent_ref: request.intent_ref,
    project_ref: request.project_ref,
    requested_at: request.requested_at,
  };
  if (!capabilityMayExecute(capabilityRequest, grants)) {
    throw new Error("CAPABILITY_DENIED: hnk-verse.execute");
  }
  return capabilityRequest;
}

export function executionReceiptToEvidence(
  request: VerseExecutionRequest,
  receipt: VerseExecutionReceipt,
  capabilityRequest: CapabilityRequest,
): VerseExecutionEvidenceBundle {
  const eventId = `event-${request.request_id}`;
  const event: EventEnvelope = {
    event_id: eventId,
    event_type: "hnk-verse.execution",
    occurred_at: receipt.executed_at ?? request.requested_at,
    recorded_at: receipt.executed_at ?? request.requested_at,
    actor: request.principal,
    runtime_ref: request.runtime,
    project_ref: request.project_ref,
    intent_refs: request.intent_ref ? [request.intent_ref] : [],
    causation_refs: [capabilityRequest.request_id],
    correlation_refs: [request.request_id],
    status: receipt.status === "rejected" ? "rejected" : receipt.status === "failed" ? "failed" : "accepted",
    payload: {
      execution_request: request.request_id,
      accepted_operations: receipt.accepted_operations,
      rejected_operations: receipt.rejected_operations,
    },
  };
  const evidence: EvidenceRef = {
    evidence_id: `evidence-${request.request_id}`,
    source_ref: eventId,
    classification: "PROCESS_INTEGRITY",
    coverage: receipt.status === "executed" ? "COMPLETE_FOR_DECLARED_REQUIREMENTS" : "PARTIAL",
    truth_assessed: false,
    causal_claim_permitted: false,
    metaphysical_proof_permitted: false,
  };
  const provenance: ProvenanceRecord = {
    source_id: `provenance-${request.request_id}`,
    source_kind: "execution_receipt",
    source_ref: eventId,
    authority_state: "OBSERVED",
    parent_refs: [request.request_id, capabilityRequest.request_id],
    transformations: [{
      operation: "execution-receipt-to-evidence",
      version: "0.1",
      input_refs: [request.request_id, eventId],
      output_ref: evidence.evidence_id,
    }],
  };
  return { capability_request: capabilityRequest, event, evidence, provenance };
}
