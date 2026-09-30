import { describe, expect, it } from "vitest";
import type { ProductionEnvironmentStateV1 } from "./ProductionReleaseGate";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import type { TrustedDeploymentReceiptV1 } from "./TrustedDeploymentGate";
import { sha256Json } from "./BuildLedger";
import {
  assertReleaseEligibleForProduction,
  rollbackProductionRelease,
  verifyProductionReleaseRollbackReceipt,
} from "./ReleaseRollbackEnforcement";

function release(
  id: string,
  version: string,
  logical: string,
  bundle: string,
  status: "RELEASED" | "REVOKED" = "RELEASED",
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
    ...(status === "REVOKED" ? { revoked_reason: "security issue" } : {}),
  };

  const release_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    release_id: `release-${id}`,
    release_hash,
  };
}

function deployReceipt(
  id: string,
  logical: string,
  bundle: string,
): TrustedDeploymentReceiptV1 {
  const unsigned = {
    schema: "goodle.trusted-deployment-receipt.v1" as const,
    action: "DEPLOY" as const,
    environment: "production",
    bundle_id: bundle,
    build_id: `build-${id}`,
    logical_build_id: logical,
    attestation_id: `attest-${id}`,
    ledger_hash: `ledger-${id}`,
    verification: {
      schema: "goodle.trusted-bundle-verification.v1" as const,
      bundle_id: bundle,
      build_id: `build-${id}`,
      logical_build_id: logical,
      decision: "ACCEPTED" as const,
      executable: true,
      reasons: [],
      integrity: {
        valid: true,
        attestation_valid: true,
        bundle_hash_valid: true,
        files_valid: true,
        paths_valid: true,
        invalid_files: [],
        invalid_paths: [],
      },
    },
    status: "AUTHORIZED" as const,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `deploy-${id}`,
    receipt_hash,
  };
}

function productionState(): ProductionEnvironmentStateV1 {
  const r1 = deployReceipt("1", "rbi-1", "bundle-1");
  const r2 = deployReceipt("2", "rbi-2", "bundle-2");

  const event1Unsigned = {
    schema: "goodle.deployment-chronicle-event.v1" as const,
    environment: "production",
    type: "ACTIVATE" as const,
    receipt_id: r1.receipt_id,
    bundle_id: r1.bundle_id,
    logical_build_id: r1.logical_build_id,
    previous_event_hash: undefined,
    rollback_from_receipt_id: undefined,
  };
  const event1Hash = sha256Json(event1Unsigned);

  const event2Unsigned = {
    schema: "goodle.deployment-chronicle-event.v1" as const,
    environment: "production",
    type: "ACTIVATE" as const,
    receipt_id: r2.receipt_id,
    bundle_id: r2.bundle_id,
    logical_build_id: r2.logical_build_id,
    previous_event_hash: event1Hash,
    rollback_from_receipt_id: undefined,
  };
  const event2Hash = sha256Json(event2Unsigned);

  return {
    schema: "goodle.environment-state.v1",
    environment: "production",
    active_receipt_id: r2.receipt_id,
    active_bundle_id: r2.bundle_id,
    active_logical_build_id: r2.logical_build_id,
    active_release_id: "release-2",
    active_release_version: "2.0.0",
    head_event_hash: event2Hash,
    revision: 2,
    history: [
      { ...event1Unsigned, event_id: "event-1", event_hash: event1Hash },
      { ...event2Unsigned, event_id: "event-2", event_hash: event2Hash },
    ],
  };
}

describe("M27 Release Rollback / Revocation Enforcement", () => {
  it("rejects revoked releases for production eligibility", () => {
    expect(() =>
      assertReleaseEligibleForProduction(
        release("2", "2.0.0", "rbi-2", "bundle-2", "REVOKED"),
      ),
    ).toThrow("PRODUCTION_RELEASE_REVOKED");
  });

  it("rolls production back to a previous released version known in the chronicle", () => {
    const result = rollbackProductionRelease({
      production: productionState(),
      current_release: release("2", "2.0.0", "rbi-2", "bundle-2"),
      target_release: release("1", "1.0.0", "rbi-1", "bundle-1"),
      target_deployment_receipt: deployReceipt("1", "rbi-1", "bundle-1"),
    });

    expect(result.production).toMatchObject({
      active_release_id: "release-1",
      active_release_version: "1.0.0",
      active_logical_build_id: "rbi-1",
      active_bundle_id: "bundle-1",
    });
    expect(result.rollback_receipt).toMatchObject({
      from_release_id: "release-2",
      to_release_id: "release-1",
      status: "ROLLED_BACK",
    });
    expect(
      verifyProductionReleaseRollbackReceipt(result.rollback_receipt),
    ).toBe(true);
  });

  it("rejects rollback to a revoked release", () => {
    expect(() =>
      rollbackProductionRelease({
        production: productionState(),
        current_release: release("2", "2.0.0", "rbi-2", "bundle-2"),
        target_release: release(
          "1",
          "1.0.0",
          "rbi-1",
          "bundle-1",
          "REVOKED",
        ),
        target_deployment_receipt: deployReceipt("1", "rbi-1", "bundle-1"),
      }),
    ).toThrow("PRODUCTION_RELEASE_REVOKED");
  });

  it("rejects release/receipt drift during rollback", () => {
    expect(() =>
      rollbackProductionRelease({
        production: productionState(),
        current_release: release("2", "2.0.0", "rbi-2", "bundle-2"),
        target_release: release("1", "1.0.0", "rbi-1", "bundle-1"),
        target_deployment_receipt: deployReceipt("1", "rbi-x", "bundle-1"),
      }),
    ).toThrow("ROLLBACK_RELEASE_RECEIPT_LOGICAL_BUILD_MISMATCH");
  });
});
