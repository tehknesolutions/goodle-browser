import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { verifyTrustedArtifactBundle } from "./TrustedArtifactBundle";

export type TrustedBundleDecision = "ACCEPTED" | "QUARANTINED" | "REJECTED";

export type TrustedBundlePolicy = {
  require_certified?: boolean;
  allow_partial?: boolean;
  expected_adapter?: string;
  expected_kind?: TrustedArtifactBundleV1["attestation"]["target"]["kind"];
};

export type TrustedBundleVerificationResult = {
  schema: "goodle.trusted-bundle-verification.v1";
  bundle_id: string;
  build_id: string;
  logical_build_id: string;
  decision: TrustedBundleDecision;
  executable: boolean;
  reasons: string[];
  integrity: ReturnType<typeof verifyTrustedArtifactBundle>;
};

export function evaluateTrustedBundle(
  bundle: TrustedArtifactBundleV1,
  policy: TrustedBundlePolicy = {},
): TrustedBundleVerificationResult {
  const integrity = verifyTrustedArtifactBundle(bundle);
  const reasons: string[] = [];

  if (!integrity.attestation_valid) reasons.push("ATTESTATION_INVALID");
  if (!integrity.bundle_hash_valid) reasons.push("BUNDLE_HASH_INVALID");
  if (!integrity.files_valid) reasons.push("FILE_INTEGRITY_FAILED");

  const certification = bundle.attestation.certification_status;
  const requireCertified = policy.require_certified ?? true;
  const allowPartial = policy.allow_partial ?? false;

  if (requireCertified && certification !== "CERTIFIED") {
    reasons.push("CERTIFICATION_NOT_CERTIFIED");
  } else if (!requireCertified && certification === "PARTIAL" && !allowPartial) {
    reasons.push("PARTIAL_NOT_ALLOWED");
  }

  if (
    policy.expected_adapter &&
    bundle.attestation.target.adapter !== policy.expected_adapter
  ) {
    reasons.push("ADAPTER_MISMATCH");
  }

  if (
    policy.expected_kind &&
    bundle.attestation.target.kind !== policy.expected_kind
  ) {
    reasons.push("KIND_MISMATCH");
  }

  const hardFailure = reasons.some((reason) =>
    [
      "ATTESTATION_INVALID",
      "BUNDLE_HASH_INVALID",
      "FILE_INTEGRITY_FAILED",
    ].includes(reason),
  );

  const decision: TrustedBundleDecision = hardFailure
    ? "REJECTED"
    : reasons.length > 0
      ? "QUARANTINED"
      : "ACCEPTED";

  return {
    schema: "goodle.trusted-bundle-verification.v1",
    bundle_id: bundle.bundle_id,
    build_id: bundle.build_id,
    logical_build_id: bundle.logical_build_id,
    decision,
    executable: decision === "ACCEPTED",
    reasons,
    integrity,
  };
}

export function assertTrustedBundleExecutable(
  verification: TrustedBundleVerificationResult,
): void {
  if (!verification.executable) {
    throw new Error(
      `TRUSTED_BUNDLE_NOT_EXECUTABLE: ${verification.decision}: ${verification.reasons.join(",")}`,
    );
  }
}
