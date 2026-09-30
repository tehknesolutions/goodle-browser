import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Json, type BuildLedgerRecordV1 } from "./BuildLedger";
import type { BuildAttestationV1 } from "./BuildAttestation";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { GovernanceSnapshotV1 } from "./GovernanceSnapshot";
import {
  appendGovernanceDecision,
  createGovernanceLedger,
} from "./GovernanceLedger";
import type { TrustedDeploymentReceiptV1 } from "./TrustedDeploymentGate";
import { createUnifiedTrustProof } from "./UnifiedTrustProof";
import {
  assertUnifiedTrustProofExecutable,
  consumeUnifiedTrustProof,
} from "./TrustProofConsumer";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function fixtures() {
  const buildUnsigned = {
    schema: "goodle.build-ledger-record.v1" as const,
    build_id: "build-consumer",
    graph_id: "graph-consumer",
    target: { kind: "web" as const, adapter: "react", version: "19" },
    report_status: "COMPLETED" as const,
    certification_status: "CERTIFIED" as const,
    report_hash: "report",
    certification_hash: "cert",
    previous_record_hash: undefined,
    artifacts: [],
  };
  const record_hash = sha256Json(buildUnsigned);
  const build_ledger: BuildLedgerRecordV1 = {
    ...buildUnsigned,
    record_id: "ledger-consumer",
    record_hash,
  };

  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-consumer",
    logical_build_id: "rbi-consumer",
    graph_id: "graph-consumer",
    target: { kind: "web" as const, adapter: "react", version: "19" },
    certification_status: "CERTIFIED" as const,
    trust: {
      report_hash: "report",
      certification_hash: "cert",
      ledger_hash: record_hash,
      identity_hash: "identity",
    },
    provenance_refs: ["prov-1"],
    artifact_entries: [".goodle/generated/entry.tsx"],
  };
  const envelope_hash = sha256Json(attestationUnsigned);
  const attestation: BuildAttestationV1 = {
    ...attestationUnsigned,
    attestation_id: "attest-consumer",
    envelope_hash,
  };

  const content = "export const consumer = true;\n";
  const file = {
    path: ".goodle/generated/entry.tsx",
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: ["prov-1"],
  };
  const bundleUnsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-consumer",
    logical_build_id: "rbi-consumer",
    attestation,
    entries: [".goodle/generated/entry.tsx"],
    files: [file],
  };
  const bundle_hash = sha256Json(bundleUnsigned);
  const bundle: TrustedArtifactBundleV1 = {
    ...bundleUnsigned,
    bundle_id: "bundle-consumer",
    bundle_hash,
  };

  const snapshotUnsigned = {
    schema: "goodle.governance-snapshot.v1" as const,
    registry_hash: "registry-consumer",
    operation: "DEPLOY" as const,
    source_environment: undefined,
    destination_environment: "staging",
    environment_policy: {
      environment: "staging",
      require_certified: true,
      allow_partial: false,
      allowed_adapters: ["react"],
      allowed_kinds: ["web" as const],
      require_released_manifest: false,
    },
    transition: undefined,
    target: { kind: "web" as const, adapter: "react", version: "19" },
    release_status: undefined,
    policy_hash: "policy-consumer",
  };
  const snapshot_hash = sha256Json(snapshotUnsigned);
  const governance_snapshot: GovernanceSnapshotV1 = {
    ...snapshotUnsigned,
    snapshot_id: "governance-consumer",
    snapshot_hash,
  };

  const receiptUnsigned = {
    schema: "goodle.trusted-deployment-receipt.v1" as const,
    action: "DEPLOY" as const,
    environment: "staging",
    bundle_id: "bundle-consumer",
    build_id: "build-consumer",
    logical_build_id: "rbi-consumer",
    attestation_id: "attest-consumer",
    ledger_hash: record_hash,
    verification: {
      schema: "goodle.trusted-bundle-verification.v1" as const,
      bundle_id: "bundle-consumer",
      build_id: "build-consumer",
      logical_build_id: "rbi-consumer",
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
  const receipt_hash = sha256Json(receiptUnsigned);
  const receipt: TrustedDeploymentReceiptV1 = {
    ...receiptUnsigned,
    receipt_id: "deploy-consumer",
    receipt_hash,
  };

  const governance_ledger = appendGovernanceDecision(
    createGovernanceLedger(),
    governance_snapshot,
    receipt,
  );

  const base = {
    build_ledger,
    attestation,
    bundle,
    governance_snapshot,
    governance_ledger,
  };

  return {
    ...base,
    proof: createUnifiedTrustProof(base),
  };
}

describe("M34 Trust Proof Consumer", () => {
  it("trusts a valid proof matching consumer policy", () => {
    const f = fixtures();
    const result = consumeUnifiedTrustProof({
      ...f,
      policy: {
        expected_environment: "staging",
        allowed_adapters: ["react"],
        allowed_kinds: ["web"],
        allowed_operations: ["DEPLOY"],
      },
    });

    expect(result).toMatchObject({
      decision: "TRUSTED",
      executable: true,
      reasons: [],
    });
    expect(() => assertUnifiedTrustProofExecutable(result)).not.toThrow();
  });

  it("quarantines a valid proof that violates consumer policy", () => {
    const f = fixtures();
    const result = consumeUnifiedTrustProof({
      ...f,
      policy: {
        expected_environment: "production",
      },
    });

    expect(result.decision).toBe("QUARANTINED");
    expect(result.executable).toBe(false);
    expect(result.reasons).toContain("ENVIRONMENT_MISMATCH");
  });

  it("rejects a cryptographically inconsistent proof", () => {
    const f = fixtures();
    const result = consumeUnifiedTrustProof({
      ...f,
      proof: { ...f.proof, bundle_id: "tampered-bundle" },
    });

    expect(result.decision).toBe("REJECTED");
    expect(result.executable).toBe(false);
    expect(result.reasons).toContain("IDENTITY_LINKS_INVALID");
  });

  it("can require a formal release", () => {
    const f = fixtures();
    const result = consumeUnifiedTrustProof({
      ...f,
      policy: {
        require_release: true,
      },
    });

    expect(result.decision).toBe("QUARANTINED");
    expect(result.reasons).toContain("RELEASE_REQUIRED");
  });
});
