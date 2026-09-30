import { describe, expect, it } from "vitest";
import type { TrustedDeploymentReceiptV1 } from "./TrustedDeploymentGate";
import { sha256Json } from "./BuildLedger";
import {
  activateDeployment,
  createEnvironmentState,
  rollbackDeployment,
  verifyDeploymentChronicle,
} from "./DeploymentChronicle";

function receipt(
  id: string,
  logical: string,
  environment = "production",
): TrustedDeploymentReceiptV1 {
  const unsigned = {
    schema: "goodle.trusted-deployment-receipt.v1" as const,
    action: "DEPLOY" as const,
    environment,
    bundle_id: `bundle-${id}`,
    build_id: `build-${id}`,
    logical_build_id: logical,
    attestation_id: `attest-${id}`,
    ledger_hash: `ledger-${id}`,
    verification: {
      schema: "goodle.trusted-bundle-verification.v1" as const,
      bundle_id: `bundle-${id}`,
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

describe("M23 Deployment Chronicle", () => {
  it("tracks the active logical build per environment", () => {
    const r1 = receipt("1", "rbi-1");
    const state = activateDeployment(createEnvironmentState("production"), r1);

    expect(state).toMatchObject({
      environment: "production",
      active_receipt_id: "deploy-1",
      active_bundle_id: "bundle-1",
      active_logical_build_id: "rbi-1",
      revision: 1,
    });
    expect(verifyDeploymentChronicle(state)).toBe(true);
  });

  it("maintains a hash-chained deployment history", () => {
    const r1 = receipt("1", "rbi-1");
    const r2 = receipt("2", "rbi-2");

    const state1 = activateDeployment(createEnvironmentState("production"), r1);
    const state2 = activateDeployment(state1, r2);

    expect(state2.history).toHaveLength(2);
    expect(state2.history[1]?.previous_event_hash).toBe(
      state2.history[0]?.event_hash,
    );
    expect(verifyDeploymentChronicle(state2)).toBe(true);
  });

  it("rolls back only to an authorized deployment already known by the chronicle", () => {
    const r1 = receipt("1", "rbi-1");
    const r2 = receipt("2", "rbi-2");

    const state1 = activateDeployment(createEnvironmentState("production"), r1);
    const state2 = activateDeployment(state1, r2);
    const rolledBack = rollbackDeployment(state2, r1);

    expect(rolledBack.active_logical_build_id).toBe("rbi-1");
    expect(rolledBack.history.at(-1)).toMatchObject({
      type: "ROLLBACK",
      receipt_id: "deploy-1",
      rollback_from_receipt_id: "deploy-2",
    });
    expect(verifyDeploymentChronicle(rolledBack)).toBe(true);
  });

  it("rejects cross-environment activation", () => {
    expect(() =>
      activateDeployment(
        createEnvironmentState("production"),
        receipt("1", "rbi-1", "staging"),
      ),
    ).toThrow("DEPLOYMENT_ENVIRONMENT_MISMATCH");
  });

  it("detects chronicle tampering", () => {
    const state = activateDeployment(
      createEnvironmentState("production"),
      receipt("1", "rbi-1"),
    );

    const tampered = {
      ...state,
      history: state.history.map((event) => ({
        ...event,
        logical_build_id: "tampered",
      })),
    };

    expect(verifyDeploymentChronicle(tampered)).toBe(false);
  });
});
