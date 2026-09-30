import type { EndToEndExternalTrustProofV1 } from "./EndToEndExternalTrustProof";
import {
  verifyEndToEndExternalTrustProof,
  type EndToEndExternalTrustVerificationV1,
} from "./EndToEndExternalTrustProof";

export type TrustProofConsumerDecision =
  | "ACCEPT"
  | "REVIEW"
  | "REJECT";

export type TrustProofConsumerPolicyV1 = {
  accept_only_compliant?: boolean;
  review_on_compliance_review_required?: boolean;
  reject_on_invalid_proof?: boolean;
};

export type TrustProofConsumerResultV1 = {
  schema: "goodle.trust-proof-consumer-result.v1";
  proof_id: string;
  package_id: string;
  decision: TrustProofConsumerDecision;
  accepted: boolean;
  review_required: boolean;
  rejected: boolean;
  reasons: string[];
  verification: EndToEndExternalTrustVerificationV1;
};

export const STRICT_TRUST_PROOF_CONSUMER_POLICY_V1: TrustProofConsumerPolicyV1 = {
  accept_only_compliant: true,
  review_on_compliance_review_required: true,
  reject_on_invalid_proof: true,
};

export function consumeEndToEndExternalTrustProof(input: {
  proof: EndToEndExternalTrustProofV1;
  policy?: TrustProofConsumerPolicyV1;
}): TrustProofConsumerResultV1 {
  const policy =
    input.policy ?? STRICT_TRUST_PROOF_CONSUMER_POLICY_V1;

  const verification = verifyEndToEndExternalTrustProof(input.proof);
  const reasons = [...verification.reasons];

  if (!verification.valid) {
    if (policy.reject_on_invalid_proof !== false) {
      return {
        schema: "goodle.trust-proof-consumer-result.v1",
        proof_id: input.proof.proof_id,
        package_id: input.proof.package_id,
        decision: "REJECT",
        accepted: false,
        review_required: false,
        rejected: true,
        reasons,
        verification,
      };
    }

    reasons.push("INVALID_PROOF_REQUIRES_REVIEW");

    return {
      schema: "goodle.trust-proof-consumer-result.v1",
      proof_id: input.proof.proof_id,
      package_id: input.proof.package_id,
      decision: "REVIEW",
      accepted: false,
      review_required: true,
      rejected: false,
      reasons,
      verification,
    };
  }

  const complianceDecision =
    input.proof.compliance_result.decision;

  if (
    complianceDecision === "NON_COMPLIANT"
  ) {
    reasons.push("COMPLIANCE_NON_COMPLIANT");

    return {
      schema: "goodle.trust-proof-consumer-result.v1",
      proof_id: input.proof.proof_id,
      package_id: input.proof.package_id,
      decision: "REJECT",
      accepted: false,
      review_required: false,
      rejected: true,
      reasons,
      verification,
    };
  }

  if (
    complianceDecision === "REVIEW_REQUIRED" &&
    policy.review_on_compliance_review_required !== false
  ) {
    reasons.push("COMPLIANCE_REVIEW_REQUIRED");

    return {
      schema: "goodle.trust-proof-consumer-result.v1",
      proof_id: input.proof.proof_id,
      package_id: input.proof.package_id,
      decision: "REVIEW",
      accepted: false,
      review_required: true,
      rejected: false,
      reasons,
      verification,
    };
  }

  if (
    policy.accept_only_compliant !== false &&
    complianceDecision !== "COMPLIANT"
  ) {
    reasons.push("COMPLIANCE_NOT_ACCEPTABLE");

    return {
      schema: "goodle.trust-proof-consumer-result.v1",
      proof_id: input.proof.proof_id,
      package_id: input.proof.package_id,
      decision: "REVIEW",
      accepted: false,
      review_required: true,
      rejected: false,
      reasons,
      verification,
    };
  }

  return {
    schema: "goodle.trust-proof-consumer-result.v1",
    proof_id: input.proof.proof_id,
    package_id: input.proof.package_id,
    decision: "ACCEPT",
    accepted: true,
    review_required: false,
    rejected: false,
    reasons,
    verification,
  };
}

export function assertTrustProofAccepted(
  result: TrustProofConsumerResultV1,
): void {
  if (!result.accepted) {
    throw new Error(
      `TRUST_PROOF_NOT_ACCEPTED: ${result.decision}: ${result.reasons.join(",")}`,
    );
  }
}
