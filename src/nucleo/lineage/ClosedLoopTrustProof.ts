import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import { sha256Json } from "./BuildLedger";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import { verifyExecutionAdmissionReceipt } from "./ExecutionAdmissionGate";
import type {
  RuntimeExecutionChronicleV1,
  RuntimeExecutionReceiptV1,
} from "./RuntimeExecutionChronicle";
import {
  verifyRuntimeExecutionChronicle,
  verifyRuntimeExecutionReceipt,
} from "./RuntimeExecutionChronicle";
import type {
  ExecutionOutcomeAttestationV1,
} from "./ExecutionOutcomeAttestation";
import {
  verifyExecutionOutcomeAttestation,
} from "./ExecutionOutcomeAttestation";

export type ClosedLoopTrustProofV1 = {
  schema: "goodle.closed-loop-trust-proof.v1";
  proof_id: string;
  base_trust_proof_id: string;
  base_trust_proof_hash: string;
  build_id: string;
  logical_build_id: string;
  bundle_id: string;
  execution_id: string;
  admission_receipt_id: string;
  admission_receipt_hash: string;
  terminal_receipt_id: string;
  terminal_receipt_hash: string;
  execution_chronicle_hash: string;
  execution_chronicle_head_hash?: string;
  outcome_attestation_id: string;
  outcome_attestation_hash: string;
  outcome: "SUCCEEDED" | "FAILED";
  result_ref?: string;
  error_code?: string;
  runtime_environment: string;
  closed_loop_hash: string;
};

export type ClosedLoopTrustProofVerificationV1 = {
  schema: "goodle.closed-loop-trust-proof-verification.v1";
  valid: boolean;
  checks: {
    base_proof_hash: boolean;
    admission: boolean;
    terminal_receipt: boolean;
    execution_chronicle: boolean;
    outcome_attestation: boolean;
    identity_links: boolean;
    closed_loop_hash: boolean;
  };
  reasons: string[];
};

export function createClosedLoopTrustProof(input: {
  base_proof: UnifiedTrustProofV1;
  admission: ExecutionAdmissionReceiptV1;
  terminal_receipt: RuntimeExecutionReceiptV1;
  execution_chronicle: RuntimeExecutionChronicleV1;
  outcome_attestation: ExecutionOutcomeAttestationV1;
}): ClosedLoopTrustProofV1 {
  const baseUnsigned = {
    schema: input.base_proof.schema,
    build_id: input.base_proof.build_id,
    logical_build_id: input.base_proof.logical_build_id,
    bundle_id: input.base_proof.bundle_id,
    release_id: input.base_proof.release_id,
    governance_snapshot_id: input.base_proof.governance_snapshot_id,
    build_ledger_hash: input.base_proof.build_ledger_hash,
    attestation_hash: input.base_proof.attestation_hash,
    bundle_hash: input.base_proof.bundle_hash,
    release_hash: input.base_proof.release_hash,
    governance_snapshot_hash: input.base_proof.governance_snapshot_hash,
    governance_ledger_hash: input.base_proof.governance_ledger_hash,
    governance_ledger_head_hash: input.base_proof.governance_ledger_head_hash,
  };

  if (sha256Json(baseUnsigned) !== input.base_proof.proof_hash) {
    throw new Error("CLOSED_LOOP_BASE_PROOF_INVALID");
  }

  if (!verifyExecutionAdmissionReceipt(input.admission)) {
    throw new Error("CLOSED_LOOP_ADMISSION_INVALID");
  }

  if (!verifyRuntimeExecutionReceipt(input.terminal_receipt)) {
    throw new Error("CLOSED_LOOP_TERMINAL_RECEIPT_INVALID");
  }

  if (!verifyRuntimeExecutionChronicle(input.execution_chronicle)) {
    throw new Error("CLOSED_LOOP_EXECUTION_CHRONICLE_INVALID");
  }

  const outcomeVerification = verifyExecutionOutcomeAttestation({
    attestation: input.outcome_attestation,
    proof: input.base_proof,
    admission: input.admission,
    terminal_receipt: input.terminal_receipt,
    execution_chronicle: input.execution_chronicle,
  });

  if (!outcomeVerification.valid) {
    throw new Error(
      `CLOSED_LOOP_OUTCOME_ATTESTATION_INVALID: ${outcomeVerification.reasons.join(",")}`,
    );
  }

  const unsigned = {
    schema: "goodle.closed-loop-trust-proof.v1" as const,
    base_trust_proof_id: input.base_proof.proof_id,
    base_trust_proof_hash: input.base_proof.proof_hash,
    build_id: input.base_proof.build_id,
    logical_build_id: input.base_proof.logical_build_id,
    bundle_id: input.base_proof.bundle_id,
    execution_id: input.outcome_attestation.execution_id,
    admission_receipt_id: input.admission.receipt_id,
    admission_receipt_hash: input.admission.receipt_hash,
    terminal_receipt_id: input.terminal_receipt.receipt_id,
    terminal_receipt_hash: input.terminal_receipt.receipt_hash,
    execution_chronicle_hash: input.execution_chronicle.chronicle_hash,
    execution_chronicle_head_hash: input.execution_chronicle.head_hash,
    outcome_attestation_id: input.outcome_attestation.attestation_id,
    outcome_attestation_hash: input.outcome_attestation.attestation_hash,
    outcome: input.outcome_attestation.outcome,
    result_ref: input.outcome_attestation.result_ref,
    error_code: input.outcome_attestation.error_code,
    runtime_environment: input.outcome_attestation.runtime_environment,
  };

  const closed_loop_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    proof_id: `closed-loop-${closed_loop_hash.slice(0, 16)}`,
    closed_loop_hash,
  };
}

export function verifyClosedLoopTrustProof(input: {
  proof: ClosedLoopTrustProofV1;
  base_proof: UnifiedTrustProofV1;
  admission: ExecutionAdmissionReceiptV1;
  terminal_receipt: RuntimeExecutionReceiptV1;
  execution_chronicle: RuntimeExecutionChronicleV1;
  outcome_attestation: ExecutionOutcomeAttestationV1;
}): ClosedLoopTrustProofVerificationV1 {
  const reasons: string[] = [];

  const {
    proof_id: _baseProofId,
    proof_hash: baseProofHash,
    ...baseUnsigned
  } = input.base_proof;
  const base_proof_hash = sha256Json(baseUnsigned) === baseProofHash;

  const admission =
    verifyExecutionAdmissionReceipt(input.admission) &&
    input.admission.decision === "ADMITTED" &&
    input.admission.executable;

  const terminal_receipt =
    verifyRuntimeExecutionReceipt(input.terminal_receipt) &&
    (
      input.terminal_receipt.status === "SUCCEEDED" ||
      input.terminal_receipt.status === "FAILED"
    );

  const execution_chronicle = verifyRuntimeExecutionChronicle(
    input.execution_chronicle,
  );

  const outcomeVerification = verifyExecutionOutcomeAttestation({
    attestation: input.outcome_attestation,
    proof: input.base_proof,
    admission: input.admission,
    terminal_receipt: input.terminal_receipt,
    execution_chronicle: input.execution_chronicle,
  });
  const outcome_attestation = outcomeVerification.valid;

  if (!base_proof_hash) reasons.push("BASE_TRUST_PROOF_HASH_INVALID");
  if (!admission) reasons.push("ADMISSION_INVALID");
  if (!terminal_receipt) reasons.push("TERMINAL_RECEIPT_INVALID");
  if (!execution_chronicle) reasons.push("EXECUTION_CHRONICLE_INVALID");
  if (!outcome_attestation) {
    reasons.push(...outcomeVerification.reasons);
  }

  const identity_links =
    input.proof.base_trust_proof_id === input.base_proof.proof_id &&
    input.proof.base_trust_proof_hash === input.base_proof.proof_hash &&
    input.proof.build_id === input.base_proof.build_id &&
    input.proof.logical_build_id === input.base_proof.logical_build_id &&
    input.proof.bundle_id === input.base_proof.bundle_id &&
    input.proof.execution_id === input.outcome_attestation.execution_id &&
    input.proof.admission_receipt_id === input.admission.receipt_id &&
    input.proof.admission_receipt_hash === input.admission.receipt_hash &&
    input.proof.terminal_receipt_id === input.terminal_receipt.receipt_id &&
    input.proof.terminal_receipt_hash === input.terminal_receipt.receipt_hash &&
    input.proof.execution_chronicle_hash === input.execution_chronicle.chronicle_hash &&
    input.proof.execution_chronicle_head_hash === input.execution_chronicle.head_hash &&
    input.proof.outcome_attestation_id === input.outcome_attestation.attestation_id &&
    input.proof.outcome_attestation_hash === input.outcome_attestation.attestation_hash &&
    input.proof.outcome === input.outcome_attestation.outcome &&
    input.proof.result_ref === input.outcome_attestation.result_ref &&
    input.proof.error_code === input.outcome_attestation.error_code &&
    input.proof.runtime_environment === input.outcome_attestation.runtime_environment;

  if (!identity_links) reasons.push("CLOSED_LOOP_IDENTITY_LINKS_INVALID");

  const {
    proof_id: _proofId,
    closed_loop_hash,
    ...unsigned
  } = input.proof;

  const closed_loop_hash_valid = sha256Json(unsigned) === closed_loop_hash;
  if (!closed_loop_hash_valid) reasons.push("CLOSED_LOOP_HASH_INVALID");

  return {
    schema: "goodle.closed-loop-trust-proof-verification.v1",
    valid:
      base_proof_hash &&
      admission &&
      terminal_receipt &&
      execution_chronicle &&
      outcome_attestation &&
      identity_links &&
      closed_loop_hash_valid,
    checks: {
      base_proof_hash,
      admission,
      terminal_receipt,
      execution_chronicle,
      outcome_attestation,
      identity_links,
      closed_loop_hash: closed_loop_hash_valid,
    },
    reasons,
  };
}
