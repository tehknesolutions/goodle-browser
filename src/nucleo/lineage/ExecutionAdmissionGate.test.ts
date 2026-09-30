import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type { GovernanceSnapshotV1 } from "./GovernanceSnapshot";
import type {
  ArtifactIntakeResultV1,
  QuarantineRecordV1,
  QuarantineReleaseReceiptV1,
} from "./SecureArtifactIntake";
import type {
  CapabilityGrant,
  CapabilityRequest,
} from "../contratos/HnkEcosystemContracts";
import {
  admitArtifactExecution,
  assertExecutionAdmitted,
  verifyExecutionAdmissionReceipt,
} from "./ExecutionAdmissionGate";

function proof(): UnifiedTrustProofV1 {
  return {
    schema: "goodle.unified-trust-proof.v1",
    proof_id: "proof-1",
    build_id: "build-1",
    logical_build_id: "rbi-1",
    bundle_id: "bundle-1",
    governance_snapshot_id: "snapshot-1",
    build_ledger_hash: "build-ledger",
    attestation_hash: "attestation",
    bundle_hash: "bundle-hash",
    governance_snapshot_hash: "snapshot-hash",
    governance_ledger_hash: "governance-ledger",
    proof_hash: "proof-hash",
  };
}

function snapshot(): GovernanceSnapshotV1 {
  const unsigned = {
    schema: "goodle.governance-snapshot.v1" as const,
    registry_hash: "registry-1",
    operation: "EXECUTE" as const,
    source_environment: undefined,
    destination_environment: "runtime",
    environment_policy: {
      environment: "runtime",
      require_certified: true,
      allow_partial: false,
      allowed_adapters: ["react"],
      allowed_kinds: ["web" as const],
      require_released_manifest: false,
    },
    transition: undefined,
    target: { kind: "web" as const, adapter: "react", version: "19" },
    release_status: undefined,
    policy_hash: "policy-1",
  };

  const snapshot_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    snapshot_id: "snapshot-1",
    snapshot_hash,
  };
}

function linkedProof(governance: GovernanceSnapshotV1): UnifiedTrustProofV1 {
  return {
    ...proof(),
    governance_snapshot_id: governance.snapshot_id,
    governance_snapshot_hash: governance.snapshot_hash,
  };
}

function request(): CapabilityRequest {
  return {
    request_id: "cap-request-1",
    subject: { canonical_id: "runtime-agent-1", actor_type: "agent" },
    capability: "artifact.execute",
    resource_ref: "bundle-1",
    project_ref: "goodle",
    requested_at: "2026-09-30T15:00:00.000Z",
  };
}

function grant(status: "active" | "revoked" = "active"): CapabilityGrant {
  return {
    grant_id: "cap-grant-1",
    subject: { canonical_id: "runtime-agent-1", actor_type: "agent" },
    capability: "artifact.execute",
    resource_refs: ["bundle-1"],
    scope: {},
    constraints: {},
    authorized_by: { canonical_id: "goodle-governance", actor_type: "service" },
    project_ref: "goodle",
    valid_from: "2026-09-30T14:00:00.000Z",
    valid_until: "2026-09-30T16:00:00.000Z",
    status,
    redelegable: false,
  };
}

function acceptedIntake(): ArtifactIntakeResultV1 {
  return {
    schema: "goodle.artifact-intake-result.v1",
    proof_id: "proof-1",
    bundle_id: "bundle-1",
    disposition: "ACCEPTED",
    executable: true,
    reasons: [],
  };
}

function quarantineRecord(): QuarantineRecordV1 {
  const unsigned = {
    schema: "goodle.quarantine-record.v1" as const,
    proof_id: "proof-1",
    proof_hash: "proof-hash",
    bundle_id: "bundle-1",
    bundle_hash: "bundle-hash",
    logical_build_id: "rbi-1",
    decision: "QUARANTINED" as const,
    reasons: ["ENVIRONMENT_MISMATCH"],
    executable: false as const,
    status: "HELD" as const,
  };

  const record_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    quarantine_id: "quarantine-1",
    record_hash,
  };
}

function quarantineIntake(
  record: QuarantineRecordV1,
): ArtifactIntakeResultV1 {
  return {
    schema: "goodle.artifact-intake-result.v1",
    proof_id: "proof-1",
    bundle_id: "bundle-1",
    disposition: "QUARANTINED",
    executable: false,
    reasons: ["ENVIRONMENT_MISMATCH"],
    quarantine_record: record,
  };
}

function releaseReceipt(
  record: QuarantineRecordV1,
): QuarantineReleaseReceiptV1 {
  const unsigned = {
    schema: "goodle.quarantine-release-receipt.v1" as const,
    quarantine_id: record.quarantine_id,
    original_record_hash: record.record_hash,
    proof_id: "proof-1",
    bundle_id: "bundle-1",
    review_decision: "TRUSTED" as const,
    status: "RELEASED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "quarantine-release-1",
    receipt_hash: sha256Json(unsigned),
  };
}

describe("M36 Execution Admission Gate", () => {
  it("admits accepted artifact with authorized capability and matching runtime", () => {
    const governance = snapshot();
    const receipt = admitArtifactExecution({
      proof: linkedProof(governance),
      governance_snapshot: governance,
      intake: acceptedIntake(),
      capability_request: request(),
      capability_grants: [grant()],
      runtime_environment: "runtime",
    });

    expect(receipt).toMatchObject({
      decision: "ADMITTED",
      executable: true,
      matched_grant_ids: ["cap-grant-1"],
    });
    expect(verifyExecutionAdmissionReceipt(receipt)).toBe(true);
    expect(() => assertExecutionAdmitted(receipt)).not.toThrow();
  });

  it("admits a quarantined artifact only with a valid release receipt", () => {
    const governance = snapshot();
    const record = quarantineRecord();

    const receipt = admitArtifactExecution({
      proof: linkedProof(governance),
      governance_snapshot: governance,
      intake: quarantineIntake(record),
      quarantine_release_receipt: releaseReceipt(record),
      capability_request: request(),
      capability_grants: [grant()],
      runtime_environment: "runtime",
    });

    expect(receipt.decision).toBe("ADMITTED");
    expect(receipt.quarantine_release_receipt_id).toBe(
      "quarantine-release-1",
    );
  });

  it("blocks accepted artifact without capability authorization", () => {
    const governance = snapshot();
    const receipt = admitArtifactExecution({
      proof: linkedProof(governance),
      governance_snapshot: governance,
      intake: acceptedIntake(),
      capability_request: request(),
      capability_grants: [grant("revoked")],
      runtime_environment: "runtime",
    });

    expect(receipt.decision).toBe("BLOCKED");
    expect(receipt.executable).toBe(false);
    expect(receipt.reasons).toContain("CAPABILITY_NOT_AUTHORIZED");
  });

  it("blocks runtime environment drift", () => {
    const governance = snapshot();
    const receipt = admitArtifactExecution({
      proof: linkedProof(governance),
      governance_snapshot: governance,
      intake: acceptedIntake(),
      capability_request: request(),
      capability_grants: [grant()],
      runtime_environment: "production",
    });

    expect(receipt.decision).toBe("BLOCKED");
    expect(receipt.reasons).toContain("RUNTIME_ENVIRONMENT_MISMATCH");
  });

  it("blocks held quarantine without release receipt", () => {
    const governance = snapshot();
    const record = quarantineRecord();
    const receipt = admitArtifactExecution({
      proof: linkedProof(governance),
      governance_snapshot: governance,
      intake: quarantineIntake(record),
      capability_request: request(),
      capability_grants: [grant()],
      runtime_environment: "runtime",
    });

    expect(receipt.decision).toBe("BLOCKED");
    expect(receipt.reasons).toContain("INTAKE_NOT_ADMISSIBLE");
  });
});
