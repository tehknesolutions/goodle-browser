import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import type { PromotionReceiptV1 } from "./PromotionPipeline";
import type { ProductionReleaseReceiptV1 } from "./ProductionReleaseGate";
import type { ProductionReleaseRollbackReceiptV1 } from "./ReleaseRollbackEnforcement";
import {
  createReleaseRegistry,
  recordProductionActivation,
  recordProductionRollback,
  registerRelease,
  syncReleaseStatus,
  verifyReleaseRegistry,
} from "./ReleaseRegistry";

function release(
  id: string,
  version: string,
  logical: string,
  bundle: string,
  status: "RC" | "RELEASED" | "REVOKED" = "RC",
): ReleaseManifestV1 {
  const unsigned = {
    schema: "goodle.release-manifest.v1" as const,
    version,
    status,
    bundle_id: bundle,
    build_id: `build-${id}`,
    logical_build_id: logical,
    attestation_id: `attest-${id}`,
    certification_status: "CERTIFIED" as const,
    promotion_policy: {
      allowed_transitions: [{ from: "staging", to: "production" }],
    },
    ...(status === "REVOKED" ? { revoked_reason: "revoked" } : {}),
  };

  return {
    ...unsigned,
    release_id: `release-${id}`,
    release_hash: sha256Json(unsigned),
  };
}

function productionReceipt(releaseId: string, version: string, logical: string, bundle: string): ProductionReleaseReceiptV1 {
  const unsigned = {
    schema: "goodle.production-release-receipt.v1" as const,
    release_id: releaseId,
    version,
    logical_build_id: logical,
    bundle_id: bundle,
    production_environment: "production",
    promotion_receipt_id: "promotion-1",
    deployment_receipt_id: "deploy-1",
    status: "ACTIVE" as const,
  };

  return {
    ...unsigned,
    receipt_id: "production-release-1",
    receipt_hash: sha256Json(unsigned),
  };
}

function rollbackReceipt(fromId: string, fromVersion: string, toId: string, toVersion: string, logical: string): ProductionReleaseRollbackReceiptV1 {
  const unsigned = {
    schema: "goodle.production-release-rollback-receipt.v1" as const,
    from_release_id: fromId,
    from_version: fromVersion,
    to_release_id: toId,
    to_version: toVersion,
    logical_build_id: logical,
    deployment_receipt_id: "deploy-old",
    status: "ROLLED_BACK" as const,
  };

  return {
    ...unsigned,
    receipt_id: "production-rollback-1",
    receipt_hash: sha256Json(unsigned),
  };
}

describe("M28 Release Registry / Version Lineage", () => {
  it("registers predecessor and successor lineage", () => {
    let registry = createReleaseRegistry();
    registry = registerRelease(registry, release("1", "1.0.0", "rbi-1", "bundle-1"));
    registry = registerRelease(registry, release("2", "2.0.0", "rbi-2", "bundle-2"));

    expect(registry.entries[0]).toMatchObject({
      release_id: "release-1",
      successor_release_id: "release-2",
    });
    expect(registry.entries[1]).toMatchObject({
      release_id: "release-2",
      predecessor_release_id: "release-1",
    });
    expect(verifyReleaseRegistry(registry)).toBe(true);
  });

  it("syncs RC to RELEASED and REVOKED status without identity drift", () => {
    let registry = registerRelease(
      createReleaseRegistry(),
      release("1", "1.0.0", "rbi-1", "bundle-1", "RC"),
    );

    registry = syncReleaseStatus(
      registry,
      release("1-released", "1.0.0", "rbi-1", "bundle-1", "RELEASED"),
    );
    registry = syncReleaseStatus(
      registry,
      release("1-revoked", "1.0.0", "rbi-1", "bundle-1", "REVOKED"),
    );

    expect(registry.entries[0]?.status).toBe("REVOKED");
    expect(verifyReleaseRegistry(registry)).toBe(true);
  });

  it("tracks active production release and rollback target", () => {
    let registry = createReleaseRegistry();
    registry = registerRelease(registry, release("1", "1.0.0", "rbi-1", "bundle-1", "RELEASED"));
    registry = registerRelease(registry, release("2", "2.0.0", "rbi-2", "bundle-2", "RELEASED"));

    registry = recordProductionActivation(
      registry,
      productionReceipt("release-2", "2.0.0", "rbi-2", "bundle-2"),
    );
    expect(registry.active_by_environment.production).toBe("release-2");

    registry = recordProductionRollback(
      registry,
      rollbackReceipt("release-2", "2.0.0", "release-1", "1.0.0", "rbi-1"),
    );
    expect(registry.active_by_environment.production).toBe("release-1");
    expect(registry.rollback_receipts).toEqual(["production-rollback-1"]);
  });

  it("detects registry tampering", () => {
    const registry = registerRelease(
      createReleaseRegistry(),
      release("1", "1.0.0", "rbi-1", "bundle-1"),
    );

    expect(
      verifyReleaseRegistry({
        ...registry,
        active_by_environment: { production: "release-x" },
      }),
    ).toBe(false);
  });
});
