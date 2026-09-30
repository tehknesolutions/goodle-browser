import type { ProductionEnvironmentStateV1 } from "./ProductionReleaseGate";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import { verifyReleaseManifest } from "./ReleaseManifest";
import type { TrustedDeploymentReceiptV1 } from "./TrustedDeploymentGate";
import { rollbackDeployment } from "./DeploymentChronicle";
import { sha256Json } from "./BuildLedger";

export type ProductionReleaseRollbackReceiptV1 = {
  schema: "goodle.production-release-rollback-receipt.v1";
  receipt_id: string;
  from_release_id: string;
  from_version: string;
  to_release_id: string;
  to_version: string;
  logical_build_id: string;
  deployment_receipt_id: string;
  status: "ROLLED_BACK";
  receipt_hash: string;
};

export function assertReleaseEligibleForProduction(
  release: ReleaseManifestV1,
): void {
  if (!verifyReleaseManifest(release)) {
    throw new Error("PRODUCTION_RELEASE_MANIFEST_INTEGRITY_FAILED");
  }
  if (release.status === "REVOKED") {
    throw new Error(`PRODUCTION_RELEASE_REVOKED: ${release.release_id}`);
  }
  if (release.status !== "RELEASED") {
    throw new Error(
      `PRODUCTION_REQUIRES_RELEASED_MANIFEST: ${release.status}`,
    );
  }
}

export function rollbackProductionRelease(input: {
  production: ProductionEnvironmentStateV1;
  current_release: ReleaseManifestV1;
  target_release: ReleaseManifestV1;
  target_deployment_receipt: TrustedDeploymentReceiptV1;
}): {
  production: ProductionEnvironmentStateV1;
  rollback_receipt: ProductionReleaseRollbackReceiptV1;
} {
  if (input.production.environment !== "production") {
    throw new Error(
      `PRODUCTION_ENVIRONMENT_REQUIRED: ${input.production.environment}`,
    );
  }

  if (!input.production.active_release_id || !input.production.active_release_version) {
    throw new Error("PRODUCTION_ACTIVE_RELEASE_REQUIRED");
  }

  if (input.production.active_release_id !== input.current_release.release_id) {
    throw new Error("PRODUCTION_CURRENT_RELEASE_MISMATCH");
  }

  if (!verifyReleaseManifest(input.current_release)) {
    throw new Error("PRODUCTION_CURRENT_RELEASE_INTEGRITY_FAILED");
  }

  assertReleaseEligibleForProduction(input.target_release);

  if (
    input.target_release.logical_build_id !==
    input.target_deployment_receipt.logical_build_id
  ) {
    throw new Error("ROLLBACK_RELEASE_RECEIPT_LOGICAL_BUILD_MISMATCH");
  }

  if (input.target_release.bundle_id !== input.target_deployment_receipt.bundle_id) {
    throw new Error("ROLLBACK_RELEASE_RECEIPT_BUNDLE_MISMATCH");
  }

  const rolledBack = rollbackDeployment(
    input.production,
    input.target_deployment_receipt,
  );

  const production: ProductionEnvironmentStateV1 = {
    ...rolledBack,
    active_release_id: input.target_release.release_id,
    active_release_version: input.target_release.version,
  };

  const unsigned = {
    schema: "goodle.production-release-rollback-receipt.v1" as const,
    from_release_id: input.current_release.release_id,
    from_version: input.current_release.version,
    to_release_id: input.target_release.release_id,
    to_version: input.target_release.version,
    logical_build_id: input.target_release.logical_build_id,
    deployment_receipt_id: input.target_deployment_receipt.receipt_id,
    status: "ROLLED_BACK" as const,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    production,
    rollback_receipt: {
      ...unsigned,
      receipt_id: `production-rollback-${receipt_hash.slice(0, 16)}`,
      receipt_hash,
    },
  };
}

export function verifyProductionReleaseRollbackReceipt(
  receipt: ProductionReleaseRollbackReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === receipt_hash;
}
