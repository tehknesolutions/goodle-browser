import type { AuthorityState, EvidenceRef, ProvenanceRecord } from "../contratos/HnkEcosystemContracts";
import type { VerseExecutionRequest, VerseExecutionReceipt } from "../verse/HnkVerseExecutionContract";

export type ArtifactKind =
  | "code" | "web" | "app" | "game" | "world" | "ui"
  | "mockup" | "wireframe" | "doc" | "gdd" | "pdd"
  | "image" | "video" | "audio" | "prompt" | "agent" | "workflow";

export type ArtifactRecord = {
  artifact_id: string;
  kind: ArtifactKind;
  media_type?: string;
  uri?: string;
  digest?: string;
  execution_ref: string;
  intent_ref?: string;
  project_ref?: string;
  source_operation_refs: string[];
  authority: AuthorityState;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type ArtifactBundle = {
  artifact: ArtifactRecord;
  evidence: EvidenceRef;
  provenance: ProvenanceRecord;
};

export function createArtifactBundle(
  request: VerseExecutionRequest,
  receipt: VerseExecutionReceipt,
  input: {
    artifact_id: string;
    kind: ArtifactKind;
    created_at: string;
    media_type?: string;
    uri?: string;
    digest?: string;
    metadata?: Record<string, unknown>;
  },
): ArtifactBundle {
  if (receipt.status !== "executed") {
    throw new Error("ARTIFACT_REJECTED: execution receipt is not executed");
  }
  if (receipt.request_id !== request.request_id) {
    throw new Error("ARTIFACT_REJECTED: receipt/request mismatch");
  }
  const artifact: ArtifactRecord = {
    artifact_id: input.artifact_id,
    kind: input.kind,
    media_type: input.media_type,
    uri: input.uri,
    digest: input.digest,
    execution_ref: request.request_id,
    intent_ref: request.intent_ref,
    project_ref: request.project_ref,
    source_operation_refs: [...receipt.accepted_operations],
    authority: "OBSERVED",
    created_at: input.created_at,
    metadata: { ...(input.metadata ?? {}) },
  };
  const evidence: EvidenceRef = {
    evidence_id: `evidence-artifact-${artifact.artifact_id}`,
    source_ref: artifact.artifact_id,
    classification: "DESCRIPTIVE",
    coverage: "COMPLETE_FOR_DECLARED_REQUIREMENTS",
    truth_assessed: false,
    causal_claim_permitted: false,
    metaphysical_proof_permitted: false,
  };
  const provenance: ProvenanceRecord = {
    source_id: `provenance-artifact-${artifact.artifact_id}`,
    source_kind: "manifested_artifact",
    source_ref: artifact.uri ?? artifact.artifact_id,
    authority_state: "OBSERVED",
    parent_refs: [request.request_id, ...artifact.source_operation_refs],
    transformations: [{
      operation: "execution-to-artifact",
      version: "0.1",
      input_refs: [request.request_id, ...artifact.source_operation_refs],
      output_ref: artifact.artifact_id,
    }],
  };
  return { artifact, evidence, provenance };
}
