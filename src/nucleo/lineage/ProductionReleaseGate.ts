import type { EnvironmentStateV1 } from "./DeploymentChronicle";
import {
  promoteTrustedBuild,
  type PromotionPolicyV1,
} from "./PromotionPipeline";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import { verifyReleaseManifest } from "./ReleaseManifest";
import { sha256Json } from "./BuildLedger";

export type ProductionReleaseReceiptV1 = {
  schema: "goodle.production-release-receipt.v1";
  receipt_id: string;
  release_id: string;
  version: string;
  logical_build_id: string;
  bundle_id: string;
  production_environment: string;
  promotion_receipt_id: string;
  deployment_receipt_id: string;
  status: "ACTIVE";
  receipt_hash: string;
};

export type ProductionEnvironmentStateV1 = EnvironmentStateV1 & {
  active_release_id?: string;
  active_release_version?: string;
};

export function promoteReleasedBuildToProduction(input: {
  source: EnvironmentStateV1;
  production: ProductionEnvironmentStateV1;
  bundle: TrustedArtifactBundleV1;
  release: ReleaseManifestV1;
  promotion_policy_override?: PromotionPolicyV1;
}): {
  production: ProductionEnvironmentStateV1;
  production_release_receipt: ProductionReleaseReceiptV1;
} {
  if (!verifyReleaseManifest(input.release)) {
    throw new Error("PRODUCTION_RELEASE_MANIFEST_INTEGRITY_FAILED");
  }
  if (input.release.status !== "RELEASED") {
    throw new Error(
      `PRODUCTION_REQUIRES_RELEASED_MANIFEST: ${input.release.status}`,
    );
  }
  if (input.release.bundle_id !== input.bundle.bundle_id) {
    throw new Error("PRODUCTION_RELEASE_BUNDLE_MISMATCH");
  }
  if (input.release.logical_build_id !== input.bundle.logical_build_id) {
    throw new Error("PRODUCTION_RELEASE_LOGICAL_BUILD_MISMATCH");
  }
  if (input.production.environment !== "production") {
    throw new Error(
      `PRODUCTION_ENVIRONMENT_REQUIRED: ${input.production.environment}`,
    );
  }

  const promotion = promoteTrustedBuild({
    source: input.source,
    destination: input.production,
    bundle: input.bundle,
    policy: input.promotion_policy_override ?? input.release.promotion_policy,
  });

  const production: ProductionEnvironmentStateV1 = {
    ...promotion.destination,
    active_release_id: input.release.release_id,
    active_release_version: input.release.version,
  };

  const unsigned = {
    schema: "goodle.production-release-receipt.v1" as const,
    release_id: input.release.release_id,
    version: input.release.version,
    logical_build_id: input.release.logical_build_id,
    bundle_id: input.release.bundle_id,
    production_environment: production.environment,
    promotion_receipt_id: promotion.promotion_receipt.promotion_id,
    deployment_receipt_id: promotion.deployment_receipt.receipt_id,
    status: "ACTIVE" as const,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    production,
    production_release_receipt: {
      ...unsigned,
      receipt_id: `production-release-${receipt_hash.slice(0, 16)}`,
      receipt_hash,
    },
  };
}

export function verifyProductionReleaseReceipt(
  receipt: ProductionReleaseReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === receipt_hash;
}
