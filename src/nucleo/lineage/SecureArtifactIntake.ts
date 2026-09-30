import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type { TrustProofConsumerResultV1 } from "./TrustProofConsumer";
import { sha256Json } from "./BuildLedger";

export type ArtifactIntakeDisposition =
  | "ACCEPTED"
  | "QUARANTINED"
  | "REJECTED";

export type QuarantineRecordV1 = {
  schema: "goodle.quarantine-record.v1";
  quarantine_id: string;
  proof_id: string;
  proof_hash: string;
  bundle_id: string;
  bundle_hash: string;
  logical_build_id: string;
  decision: "QUARANTINED" | "REJECTED";
  reasons: string[];
  executable: false;
  status: "HELD" | "RELEASED";
  record_hash: string;
};

export type ArtifactIntakeResultV1 = {
  schema: "goodle.artifact-intake-result.v1";
  proof_id: string;
  bundle_id: string;
  disposition: ArtifactIntakeDisposition;
  executable: boolean;
  reasons: string[];
  quarantine_record?: QuarantineRecordV1;
};

export type QuarantineReleaseReceiptV1 = {
  schema: "goodle.quarantine-release-receipt.v1";
  receipt_id: string;
  quarantine_id: string;
  original_record_hash: string;
  proof_id: string;
  bundle_id: string;
  review_decision: "TRUSTED";
  status: "RELEASED";
  receipt_hash: string;
};

function createQuarantineRecord(input: {
  proof: UnifiedTrustProofV1;
  bundle: TrustedArtifactBundleV1;
  consumer_result: TrustProofConsumerResultV1;
}): QuarantineRecordV1 {
  if (input.consumer_result.decision === "TRUSTED") {
    throw new Error("QUARANTINE_REQUIRES_NON_TRUSTED_DECISION");
  }

  const unsigned = {
    schema: "goodle.quarantine-record.v1" as const,
    proof_id: input.proof.proof_id,
    proof_hash: input.proof.proof_hash,
    bundle_id: input.bundle.bundle_id,
    bundle_hash: input.bundle.bundle_hash,
    logical_build_id: input.bundle.logical_build_id,
    decision: input.consumer_result.decision,
    reasons: [...input.consumer_result.reasons],
    executable: false as const,
    status: "HELD" as const,
  };

  const record_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    quarantine_id: `quarantine-${record_hash.slice(0, 16)}`,
    record_hash,
  };
}

export function intakeArtifact(input: {
  proof: UnifiedTrustProofV1;
  bundle: TrustedArtifactBundleV1;
  consumer_result: TrustProofConsumerResultV1;
}): ArtifactIntakeResultV1 {
  if (input.consumer_result.proof_id !== input.proof.proof_id) {
    throw new Error("INTAKE_PROOF_RESULT_MISMATCH");
  }
  if (input.proof.bundle_id !== input.bundle.bundle_id) {
    throw new Error("INTAKE_PROOF_BUNDLE_MISMATCH");
  }

  if (input.consumer_result.decision === "TRUSTED") {
    return {
      schema: "goodle.artifact-intake-result.v1",
      proof_id: input.proof.proof_id,
      bundle_id: input.bundle.bundle_id,
      disposition: "ACCEPTED",
      executable: true,
      reasons: [],
    };
  }

  const quarantine_record = createQuarantineRecord(input);

  return {
    schema: "goodle.artifact-intake-result.v1",
    proof_id: input.proof.proof_id,
    bundle_id: input.bundle.bundle_id,
    disposition: input.consumer_result.decision,
    executable: false,
    reasons: [...input.consumer_result.reasons],
    quarantine_record,
  };
}

export function verifyQuarantineRecord(record: QuarantineRecordV1): boolean {
  const {
    quarantine_id: _quarantineId,
    record_hash,
    ...unsigned
  } = record;

  return sha256Json(unsigned) === record_hash;
}

export function releaseQuarantinedArtifact(input: {
  record: QuarantineRecordV1;
  reviewed_consumer_result: TrustProofConsumerResultV1;
}): {
  record: QuarantineRecordV1;
  release_receipt: QuarantineReleaseReceiptV1;
} {
  if (!verifyQuarantineRecord(input.record)) {
    throw new Error("QUARANTINE_RECORD_INTEGRITY_FAILED");
  }
  if (input.record.status !== "HELD") {
    throw new Error("QUARANTINE_RECORD_NOT_HELD");
  }
  if (input.reviewed_consumer_result.proof_id !== input.record.proof_id) {
    throw new Error("QUARANTINE_REVIEW_PROOF_MISMATCH");
  }
  if (
    input.reviewed_consumer_result.decision !== "TRUSTED" ||
    !input.reviewed_consumer_result.executable
  ) {
    throw new Error("QUARANTINE_RELEASE_REQUIRES_TRUSTED_REVIEW");
  }

  const releasedUnsigned = {
    schema: input.record.schema,
    proof_id: input.record.proof_id,
    proof_hash: input.record.proof_hash,
    bundle_id: input.record.bundle_id,
    bundle_hash: input.record.bundle_hash,
    logical_build_id: input.record.logical_build_id,
    decision: input.record.decision,
    reasons: [...input.record.reasons],
    executable: false as const,
    status: "RELEASED" as const,
  };
  const releasedHash = sha256Json(releasedUnsigned);
  const releasedRecord: QuarantineRecordV1 = {
    ...releasedUnsigned,
    quarantine_id: input.record.quarantine_id,
    record_hash: releasedHash,
  };

  const receiptUnsigned = {
    schema: "goodle.quarantine-release-receipt.v1" as const,
    quarantine_id: input.record.quarantine_id,
    original_record_hash: input.record.record_hash,
    proof_id: input.record.proof_id,
    bundle_id: input.record.bundle_id,
    review_decision: "TRUSTED" as const,
    status: "RELEASED" as const,
  };
  const receipt_hash = sha256Json(receiptUnsigned);

  return {
    record: releasedRecord,
    release_receipt: {
      ...receiptUnsigned,
      receipt_id: `quarantine-release-${receipt_hash.slice(0, 16)}`,
      receipt_hash,
    },
  };
}

export function verifyQuarantineReleaseReceipt(
  receipt: QuarantineReleaseReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === receipt_hash;
}
