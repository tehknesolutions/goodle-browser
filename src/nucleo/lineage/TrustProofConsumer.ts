import type { BuildLedgerRecordV1 } from "./BuildLedger";
import type { BuildAttestationV1 } from "./BuildAttestation";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import type { GovernanceSnapshotV1 } from "./GovernanceSnapshot";
import type { GovernanceLedgerV1 } from "./GovernanceLedger";
import type {
  UnifiedTrustProofV1,
  UnifiedTrustProofVerificationV1,
} from "./UnifiedTrustProof";
import { verifyUnifiedTrustProof } from "./UnifiedTrustProof";

export type TrustProofDecision = "TRUSTED" | "QUARANTINED" | "REJECTED";

export type TrustProofConsumerPolicyV1 = {
  require_release?: boolean;
  require_released_status?: boolean;
  expected_environment?: string;
  allowed_adapters?: string[];
  allowed_kinds?: Array<TrustedArtifactBundleV1["attestation"]["target"]["kind"]>;
  allowed_operations?: GovernanceSnapshotV1["operation"][];
};

export type TrustProofConsumerResultV1 = {
  schema: "goodle.trust-proof-consumer-result.v1";
  proof_id: string;
  decision: TrustProofDecision;
  executable: boolean;
  reasons: string[];
  verification: UnifiedTrustProofVerificationV1;
};

export function consumeUnifiedTrustProof(input: {
  proof: UnifiedTrustProofV1;
  build_ledger: BuildLedgerRecordV1;
  attestation: BuildAttestationV1;
  bundle: TrustedArtifactBundleV1;
  release?: ReleaseManifestV1;
  governance_snapshot: GovernanceSnapshotV1;
  governance_ledger: GovernanceLedgerV1;
  policy?: TrustProofConsumerPolicyV1;
}): TrustProofConsumerResultV1 {
  const verification = verifyUnifiedTrustProof({
    proof: input.proof,
    build_ledger: input.build_ledger,
    attestation: input.attestation,
    bundle: input.bundle,
    release: input.release,
    governance_snapshot: input.governance_snapshot,
    governance_ledger: input.governance_ledger,
  });

  const reasons = [...verification.reasons];

  if (!verification.valid) {
    return {
      schema: "goodle.trust-proof-consumer-result.v1",
      proof_id: input.proof.proof_id,
      decision: "REJECTED",
      executable: false,
      reasons,
      verification,
    };
  }

  const policy = input.policy ?? {};

  if (policy.require_release && !input.release) {
    reasons.push("RELEASE_REQUIRED");
  }

  if (
    policy.require_released_status &&
    input.release?.status !== "RELEASED"
  ) {
    reasons.push("RELEASE_NOT_RELEASED");
  }

  if (
    policy.expected_environment &&
    input.governance_snapshot.destination_environment !==
      policy.expected_environment
  ) {
    reasons.push("ENVIRONMENT_MISMATCH");
  }

  if (
    policy.allowed_adapters &&
    !policy.allowed_adapters.includes(input.bundle.attestation.target.adapter)
  ) {
    reasons.push("ADAPTER_NOT_ALLOWED");
  }

  if (
    policy.allowed_kinds &&
    !policy.allowed_kinds.includes(input.bundle.attestation.target.kind)
  ) {
    reasons.push("KIND_NOT_ALLOWED");
  }

  if (
    policy.allowed_operations &&
    !policy.allowed_operations.includes(input.governance_snapshot.operation)
  ) {
    reasons.push("OPERATION_NOT_ALLOWED");
  }

  const decision: TrustProofDecision =
    reasons.length === 0 ? "TRUSTED" : "QUARANTINED";

  return {
    schema: "goodle.trust-proof-consumer-result.v1",
    proof_id: input.proof.proof_id,
    decision,
    executable: decision === "TRUSTED",
    reasons,
    verification,
  };
}

export function assertUnifiedTrustProofExecutable(
  result: TrustProofConsumerResultV1,
): void {
  if (!result.executable) {
    throw new Error(
      `UNIFIED_TRUST_PROOF_NOT_EXECUTABLE: ${result.decision}: ${result.reasons.join(",")}`,
    );
  }
}
