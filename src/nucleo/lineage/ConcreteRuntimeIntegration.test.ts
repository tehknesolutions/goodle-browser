import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import { createManifestationTarget } from "../manifestacao/ManifestationGraph";
import type { GoodleIRNode } from "../ir/GoodleIR";
import { executeAdmittedManifestationTarget } from "./ConcreteRuntimeIntegration";

function baseProof(): UnifiedTrustProofV1 {
  const unsigned = {
    schema: "goodle.unified-trust-proof.v1" as const,
    build_id: "build-m41",
    logical_build_id: "rbi-m41",
    bundle_id: "bundle-m41",
    release_id: undefined,
    governance_snapshot_id: "snapshot-m41",
    build_ledger_hash: "ledger-m41",
    attestation_hash: "attest-m41",
    bundle_hash: "bundle-hash-m41",
    release_hash: undefined,
    governance_snapshot_hash: "snapshot-hash-m41",
    governance_ledger_hash: "governance-ledger-m41",
    governance_ledger_head_hash: "governance-head-m41",
  };

  return {
    ...unsigned,
    proof_id: "trust-proof-m41",
    proof_hash: sha256Json(unsigned),
  };
}

function admission(): ExecutionAdmissionReceiptV1 {
  const unsigned = {
    schema: "goodle.execution-admission-receipt.v1" as const,
    proof_id: "trust-proof-m41",
    bundle_id: "bundle-m41",
    runtime_environment: "runtime",
    capability_request_id: "cap-m41",
    matched_grant_ids: ["grant-m41"],
    intake_disposition: "ACCEPTED" as const,
    quarantine_release_receipt_id: undefined,
    decision: "ADMITTED" as const,
    executable: true,
    reasons: [],
  };

  return {
    ...unsigned,
    receipt_id: "admission-m41",
    receipt_hash: sha256Json(unsigned),
  };
}

const runtime_ref = {
  canonical_id: "goodle-runtime-m41",
  actor_type: "service" as const,
};

function node(id: string): GoodleIRNode {
  return {
    id,
    semantica: "interface interativa",
    familia: "estrutura",
  };
}

describe("M41 Concrete Runtime Integration", () => {
  it("executes the built-in React 19 runtime executor and closes the trust loop", () => {
    const source = node("react-screen");
    const target = createManifestationTarget(source, "web", "react", "19");

    const result = executeAdmittedManifestationTarget({
      base_proof: baseProof(),
      admission: admission(),
      target,
      source,
      runtime_ref,
    });

    expect(result.target_execution.status).toBe("EXECUTED");
    expect(result.target_execution.output).toMatchObject({
      artifact_type: "react-component",
      runtime: "react",
      runtime_version: "19",
      entry: "src/generated/GoodleArtifact.tsx",
    });
    expect(result.terminal_receipt.status).toBe("SUCCEEDED");
    expect(result.outcome_attestation.outcome).toBe("SUCCEEDED");
    expect(result.closed_loop_proof.outcome).toBe("SUCCEEDED");
    expect(result.closed_loop_proof.result_ref).toContain(
      "artifact://react@19/src/generated/GoodleArtifact.tsx",
    );
  });

  it("executes the built-in Phaser 3 runtime executor and closes the trust loop", () => {
    const source = node("game-scene");
    const target = createManifestationTarget(source, "game", "phaser", "3");

    const result = executeAdmittedManifestationTarget({
      base_proof: baseProof(),
      admission: admission(),
      target,
      source,
      runtime_ref,
    });

    expect(result.target_execution.status).toBe("EXECUTED");
    expect(result.target_execution.output).toMatchObject({
      artifact_type: "phaser-scene",
      runtime: "phaser",
      runtime_version: "3",
      entry: "src/generated/GoodleScene.ts",
    });
    expect(result.terminal_receipt.status).toBe("SUCCEEDED");
    expect(result.execution_chronicle.entries.map((entry) => entry.status)).toEqual([
      "STARTED",
      "SUCCEEDED",
    ]);
  });

  it("records executor routing failure as a real failed runtime outcome", () => {
    const source = node("hybrid-scene");
    const target = createManifestationTarget(
      source,
      "web",
      "react-phaser",
      "1",
    );

    const result = executeAdmittedManifestationTarget({
      base_proof: baseProof(),
      admission: admission(),
      target,
      source,
      runtime_ref,
    });

    expect(result.target_execution.status).toBe("BLOCKED_CONTRACT_ONLY");
    expect(result.terminal_receipt.status).toBe("FAILED");
    expect(result.outcome_attestation.outcome).toBe("FAILED");
    expect(result.closed_loop_proof.error_code).toContain(
      "BLOCKED_CONTRACT_ONLY",
    );
  });
});
