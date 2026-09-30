import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type {
  ArtifactIntakeResultV1,
  QuarantineReleaseReceiptV1,
} from "./SecureArtifactIntake";
import {
  verifyQuarantineRecord,
  verifyQuarantineReleaseReceipt,
} from "./SecureArtifactIntake";
import type { GovernanceSnapshotV1 } from "./GovernanceSnapshot";
import { verifyGovernanceSnapshot } from "./GovernanceSnapshot";
import type {
  CapabilityGrant,
  CapabilityRequest,
} from "../contratos/HnkEcosystemContracts";
import { capabilityMayExecute } from "../contratos/HnkEcosystemContracts";
import { sha256Json } from "./BuildLedger";

export type ExecutionAdmissionDecision = "ADMITTED" | "BLOCKED";

export type ExecutionAdmissionReceiptV1 = {
  schema: "goodle.execution-admission-receipt.v1";
  receipt_id: string;
  proof_id: string;
  bundle_id: string;
  runtime_environment: string;
  capability_request_id: string;
  matched_grant_ids: string[];
  intake_disposition: ArtifactIntakeResultV1["disposition"];
  quarantine_release_receipt_id?: string;
  decision: ExecutionAdmissionDecision;
  executable: boolean;
  reasons: string[];
  receipt_hash: string;
};

function matchingGrantIds(
  request: CapabilityRequest,
  grants: readonly CapabilityGrant[],
): string[] {
  return grants
    .filter((grant) => capabilityMayExecute(request, [grant]))
    .map((grant) => grant.grant_id)
    .sort();
}

export function admitArtifactExecution(input: {
  proof: UnifiedTrustProofV1;
  governance_snapshot: GovernanceSnapshotV1;
  intake: ArtifactIntakeResultV1;
  quarantine_release_receipt?: QuarantineReleaseReceiptV1;
  capability_request: CapabilityRequest;
  capability_grants: readonly CapabilityGrant[];
  runtime_environment: string;
}): ExecutionAdmissionReceiptV1 {
  const reasons: string[] = [];

  if (!verifyGovernanceSnapshot(input.governance_snapshot)) {
    reasons.push("GOVERNANCE_SNAPSHOT_INVALID");
  }

  if (
    input.proof.governance_snapshot_id !== input.governance_snapshot.snapshot_id ||
    input.proof.governance_snapshot_hash !== input.governance_snapshot.snapshot_hash
  ) {
    reasons.push("PROOF_GOVERNANCE_SNAPSHOT_MISMATCH");
  }

  if (
    input.intake.proof_id !== input.proof.proof_id ||
    input.intake.bundle_id !== input.proof.bundle_id
  ) {
    reasons.push("INTAKE_PROOF_MISMATCH");
  }

  let intakeAdmissible = false;

  if (
    input.intake.disposition === "ACCEPTED" &&
    input.intake.executable
  ) {
    intakeAdmissible = true;
  } else if (input.quarantine_release_receipt) {
    const quarantine = input.intake.quarantine_record;

    if (!verifyQuarantineReleaseReceipt(input.quarantine_release_receipt)) {
      reasons.push("QUARANTINE_RELEASE_RECEIPT_INVALID");
    }

    if (!quarantine || !verifyQuarantineRecord(quarantine)) {
      reasons.push("QUARANTINE_RECORD_INVALID");
    } else {
      if (
        input.quarantine_release_receipt.quarantine_id !== quarantine.quarantine_id ||
        input.quarantine_release_receipt.original_record_hash !== quarantine.record_hash ||
        input.quarantine_release_receipt.proof_id !== input.proof.proof_id ||
        input.quarantine_release_receipt.bundle_id !== input.proof.bundle_id
      ) {
        reasons.push("QUARANTINE_RELEASE_LINK_MISMATCH");
      } else if (
        input.quarantine_release_receipt.status === "RELEASED" &&
        input.quarantine_release_receipt.review_decision === "TRUSTED"
      ) {
        intakeAdmissible = true;
      }
    }
  }

  if (!intakeAdmissible) {
    reasons.push("INTAKE_NOT_ADMISSIBLE");
  }

  if (
    input.runtime_environment !==
    input.governance_snapshot.destination_environment
  ) {
    reasons.push("RUNTIME_ENVIRONMENT_MISMATCH");
  }

  if (input.capability_request.resource_ref !== input.proof.bundle_id) {
    reasons.push("CAPABILITY_RESOURCE_MISMATCH");
  }

  const matched_grant_ids = matchingGrantIds(
    input.capability_request,
    input.capability_grants,
  );

  if (
    !capabilityMayExecute(
      input.capability_request,
      input.capability_grants,
    )
  ) {
    reasons.push("CAPABILITY_NOT_AUTHORIZED");
  }

  const decision: ExecutionAdmissionDecision =
    reasons.length === 0 ? "ADMITTED" : "BLOCKED";

  const unsigned = {
    schema: "goodle.execution-admission-receipt.v1" as const,
    proof_id: input.proof.proof_id,
    bundle_id: input.proof.bundle_id,
    runtime_environment: input.runtime_environment,
    capability_request_id: input.capability_request.request_id,
    matched_grant_ids,
    intake_disposition: input.intake.disposition,
    quarantine_release_receipt_id:
      input.quarantine_release_receipt?.receipt_id,
    decision,
    executable: decision === "ADMITTED",
    reasons,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `execution-admission-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function verifyExecutionAdmissionReceipt(
  receipt: ExecutionAdmissionReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === receipt_hash;
}

export function assertExecutionAdmitted(
  receipt: ExecutionAdmissionReceiptV1,
): void {
  if (!receipt.executable || receipt.decision !== "ADMITTED") {
    throw new Error(
      `EXECUTION_NOT_ADMITTED: ${receipt.reasons.join(",")}`,
    );
  }
}
