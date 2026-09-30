import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import {
  verifyExecutionAdmissionReceipt,
  assertExecutionAdmitted,
} from "./ExecutionAdmissionGate";
import type {
  RuntimeExecutionChronicleV1,
  RuntimeExecutionReceiptV1,
} from "./RuntimeExecutionChronicle";
import {
  verifyRuntimeExecutionChronicle,
  verifyRuntimeExecutionReceipt,
} from "./RuntimeExecutionChronicle";
import { sha256Json } from "./BuildLedger";

export type ExecutionOutcomeAttestationV1 = {
  schema: "goodle.execution-outcome-attestation.v1";
  attestation_id: string;
  execution_id: string;
  proof_id: string;
  proof_hash: string;
  bundle_id: string;
  admission_receipt_id: string;
  admission_receipt_hash: string;
  terminal_receipt_id: string;
  terminal_receipt_hash: string;
  runtime_environment: string;
  runtime_ref: RuntimeExecutionReceiptV1["runtime_ref"];
  outcome: "SUCCEEDED" | "FAILED";
  result_ref?: string;
  error_code?: string;
  execution_chronicle_hash: string;
  execution_chronicle_head_hash?: string;
  attestation_hash: string;
};

export type ExecutionOutcomeAttestationVerificationV1 = {
  schema: "goodle.execution-outcome-attestation-verification.v1";
  valid: boolean;
  checks: {
    admission: boolean;
    terminal_receipt: boolean;
    chronicle: boolean;
    identity_links: boolean;
    attestation_hash: boolean;
  };
  reasons: string[];
};

export function createExecutionOutcomeAttestation(input: {
  proof: UnifiedTrustProofV1;
  admission: ExecutionAdmissionReceiptV1;
  terminal_receipt: RuntimeExecutionReceiptV1;
  execution_chronicle: RuntimeExecutionChronicleV1;
}): ExecutionOutcomeAttestationV1 {
  if (!verifyExecutionAdmissionReceipt(input.admission)) {
    throw new Error("EXECUTION_OUTCOME_ADMISSION_INVALID");
  }
  assertExecutionAdmitted(input.admission);

  if (!verifyRuntimeExecutionReceipt(input.terminal_receipt)) {
    throw new Error("EXECUTION_OUTCOME_TERMINAL_RECEIPT_INVALID");
  }
  if (!verifyRuntimeExecutionChronicle(input.execution_chronicle)) {
    throw new Error("EXECUTION_OUTCOME_CHRONICLE_INVALID");
  }
  if (
    input.terminal_receipt.status !== "SUCCEEDED" &&
    input.terminal_receipt.status !== "FAILED"
  ) {
    throw new Error("EXECUTION_OUTCOME_REQUIRES_TERMINAL_RECEIPT");
  }

  if (
    input.proof.proof_id !== input.admission.proof_id ||
    input.proof.bundle_id !== input.admission.bundle_id
  ) {
    throw new Error("EXECUTION_OUTCOME_PROOF_ADMISSION_MISMATCH");
  }

  if (
    input.terminal_receipt.admission_receipt_id !== input.admission.receipt_id ||
    input.terminal_receipt.admission_receipt_hash !== input.admission.receipt_hash ||
    input.terminal_receipt.proof_id !== input.proof.proof_id ||
    input.terminal_receipt.bundle_id !== input.proof.bundle_id ||
    input.terminal_receipt.runtime_environment !== input.admission.runtime_environment
  ) {
    throw new Error("EXECUTION_OUTCOME_RUNTIME_LINK_MISMATCH");
  }

  const chronicleEntry = input.execution_chronicle.entries.find(
    (entry) =>
      entry.execution_id === input.terminal_receipt.execution_id &&
      entry.receipt_id === input.terminal_receipt.receipt_id &&
      entry.receipt_hash === input.terminal_receipt.receipt_hash,
  );

  if (!chronicleEntry) {
    throw new Error("EXECUTION_OUTCOME_TERMINAL_NOT_IN_CHRONICLE");
  }

  const unsigned = {
    schema: "goodle.execution-outcome-attestation.v1" as const,
    execution_id: input.terminal_receipt.execution_id,
    proof_id: input.proof.proof_id,
    proof_hash: input.proof.proof_hash,
    bundle_id: input.proof.bundle_id,
    admission_receipt_id: input.admission.receipt_id,
    admission_receipt_hash: input.admission.receipt_hash,
    terminal_receipt_id: input.terminal_receipt.receipt_id,
    terminal_receipt_hash: input.terminal_receipt.receipt_hash,
    runtime_environment: input.terminal_receipt.runtime_environment,
    runtime_ref: { ...input.terminal_receipt.runtime_ref },
    outcome: input.terminal_receipt.status,
    result_ref: input.terminal_receipt.result_ref,
    error_code: input.terminal_receipt.error_code,
    execution_chronicle_hash: input.execution_chronicle.chronicle_hash,
    execution_chronicle_head_hash: input.execution_chronicle.head_hash,
  };

  const attestation_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    attestation_id: `execution-outcome-${attestation_hash.slice(0, 16)}`,
    attestation_hash,
  };
}

export function verifyExecutionOutcomeAttestation(input: {
  attestation: ExecutionOutcomeAttestationV1;
  proof: UnifiedTrustProofV1;
  admission: ExecutionAdmissionReceiptV1;
  terminal_receipt: RuntimeExecutionReceiptV1;
  execution_chronicle: RuntimeExecutionChronicleV1;
}): ExecutionOutcomeAttestationVerificationV1 {
  const reasons: string[] = [];

  const admission = verifyExecutionAdmissionReceipt(input.admission) &&
    input.admission.decision === "ADMITTED" &&
    input.admission.executable;

  const terminal_receipt =
    verifyRuntimeExecutionReceipt(input.terminal_receipt) &&
    (input.terminal_receipt.status === "SUCCEEDED" ||
      input.terminal_receipt.status === "FAILED");

  const chronicle = verifyRuntimeExecutionChronicle(
    input.execution_chronicle,
  );

  if (!admission) reasons.push("ADMISSION_INVALID");
  if (!terminal_receipt) reasons.push("TERMINAL_RECEIPT_INVALID");
  if (!chronicle) reasons.push("EXECUTION_CHRONICLE_INVALID");

  const chronicleEntry = input.execution_chronicle.entries.find(
    (entry) =>
      entry.execution_id === input.terminal_receipt.execution_id &&
      entry.receipt_id === input.terminal_receipt.receipt_id &&
      entry.receipt_hash === input.terminal_receipt.receipt_hash,
  );

  const identity_links =
    input.attestation.execution_id === input.terminal_receipt.execution_id &&
    input.attestation.proof_id === input.proof.proof_id &&
    input.attestation.proof_hash === input.proof.proof_hash &&
    input.attestation.bundle_id === input.proof.bundle_id &&
    input.admission.proof_id === input.proof.proof_id &&
    input.admission.bundle_id === input.proof.bundle_id &&
    input.attestation.admission_receipt_id === input.admission.receipt_id &&
    input.attestation.admission_receipt_hash === input.admission.receipt_hash &&
    input.terminal_receipt.admission_receipt_id === input.admission.receipt_id &&
    input.terminal_receipt.admission_receipt_hash === input.admission.receipt_hash &&
    input.attestation.terminal_receipt_id === input.terminal_receipt.receipt_id &&
    input.attestation.terminal_receipt_hash === input.terminal_receipt.receipt_hash &&
    input.attestation.execution_chronicle_hash === input.execution_chronicle.chronicle_hash &&
    input.attestation.execution_chronicle_head_hash === input.execution_chronicle.head_hash &&
    Boolean(chronicleEntry);

  if (!identity_links) reasons.push("EXECUTION_OUTCOME_IDENTITY_LINKS_INVALID");

  const {
    attestation_id: _attestationId,
    attestation_hash,
    ...unsigned
  } = input.attestation;

  const attestation_hash_valid = sha256Json(unsigned) === attestation_hash;
  if (!attestation_hash_valid) reasons.push("EXECUTION_OUTCOME_ATTESTATION_HASH_INVALID");

  return {
    schema: "goodle.execution-outcome-attestation-verification.v1",
    valid:
      admission &&
      terminal_receipt &&
      chronicle &&
      identity_links &&
      attestation_hash_valid,
    checks: {
      admission,
      terminal_receipt,
      chronicle,
      identity_links,
      attestation_hash: attestation_hash_valid,
    },
    reasons,
  };
}
