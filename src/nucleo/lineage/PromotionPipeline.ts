import type { EnvironmentStateV1 } from "./DeploymentChronicle";
import { activateDeployment, verifyDeploymentChronicle } from "./DeploymentChronicle";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { TrustedBundlePolicy } from "./TrustedBundleConsumer";
import {
  authorizeTrustedDeployment,
  type TrustedDeploymentReceiptV1,
} from "./TrustedDeploymentGate";
import { sha256Json } from "./BuildLedger";

export type PromotionPolicyV1 = {
  allowed_transitions: Array<{ from: string; to: string }>;
  destination_policy?: TrustedBundlePolicy;
};

export type PromotionReceiptV1 = {
  schema: "goodle.promotion-receipt.v1";
  promotion_id: string;
  from_environment: string;
  to_environment: string;
  logical_build_id: string;
  bundle_id: string;
  source_active_receipt_id: string;
  destination_deployment_receipt_id: string;
  status: "PROMOTED";
  promotion_hash: string;
};

function assertTransitionAllowed(
  from: string,
  to: string,
  policy: PromotionPolicyV1,
): void {
  const allowed = policy.allowed_transitions.some(
    (transition) => transition.from === from && transition.to === to,
  );
  if (!allowed) {
    throw new Error(`PROMOTION_TRANSITION_NOT_ALLOWED: ${from} -> ${to}`);
  }
}

export function promoteTrustedBuild(input: {
  source: EnvironmentStateV1;
  destination: EnvironmentStateV1;
  bundle: TrustedArtifactBundleV1;
  policy: PromotionPolicyV1;
}): {
  destination: EnvironmentStateV1;
  deployment_receipt: TrustedDeploymentReceiptV1;
  promotion_receipt: PromotionReceiptV1;
} {
  if (!verifyDeploymentChronicle(input.source)) {
    throw new Error("PROMOTION_SOURCE_CHRONICLE_INVALID");
  }
  if (!verifyDeploymentChronicle(input.destination)) {
    throw new Error("PROMOTION_DESTINATION_CHRONICLE_INVALID");
  }

  if (!input.source.active_receipt_id || !input.source.active_logical_build_id) {
    throw new Error("PROMOTION_SOURCE_NOT_ACTIVE");
  }

  if (input.source.active_logical_build_id !== input.bundle.logical_build_id) {
    throw new Error(
      `PROMOTION_LOGICAL_BUILD_MISMATCH: ${input.source.active_logical_build_id} != ${input.bundle.logical_build_id}`,
    );
  }

  if (input.source.active_bundle_id !== input.bundle.bundle_id) {
    throw new Error(
      `PROMOTION_BUNDLE_MISMATCH: ${input.source.active_bundle_id} != ${input.bundle.bundle_id}`,
    );
  }

  assertTransitionAllowed(
    input.source.environment,
    input.destination.environment,
    input.policy,
  );

  const deployment_receipt = authorizeTrustedDeployment({
    action: "DEPLOY",
    environment: input.destination.environment,
    bundle: input.bundle,
    policy: input.policy.destination_policy,
  });

  if (deployment_receipt.status !== "AUTHORIZED") {
    throw new Error(
      `PROMOTION_DESTINATION_BLOCKED: ${deployment_receipt.verification.decision}`,
    );
  }

  const destination = activateDeployment(
    input.destination,
    deployment_receipt,
  );

  const unsigned = {
    schema: "goodle.promotion-receipt.v1" as const,
    from_environment: input.source.environment,
    to_environment: input.destination.environment,
    logical_build_id: input.bundle.logical_build_id,
    bundle_id: input.bundle.bundle_id,
    source_active_receipt_id: input.source.active_receipt_id,
    destination_deployment_receipt_id: deployment_receipt.receipt_id,
    status: "PROMOTED" as const,
  };

  const promotion_hash = sha256Json(unsigned);

  return {
    destination,
    deployment_receipt,
    promotion_receipt: {
      ...unsigned,
      promotion_id: `promotion-${promotion_hash.slice(0, 16)}`,
      promotion_hash,
    },
  };
}

export function verifyPromotionReceipt(
  receipt: PromotionReceiptV1,
): boolean {
  const {
    promotion_id: _promotionId,
    promotion_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === promotion_hash;
}
