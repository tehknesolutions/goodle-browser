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
import {
  createUnifiedTrustProof,
  verifyUnifiedTrustProof,
} from "./UnifiedTrustProof";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function fixtures() {
  const buildUnsigned = {
    schema: "goodle.build-ledger-record.v1" as const,
    build_id: "build-unified",
    graph_id: "graph-unified",
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
    record_id: "ledger-unified",
    record_hash,
  };

  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-unified",
    logical_build_id: "rbi-unified",
    graph_id: "graph-unified",
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
    attestation_id: "attest-unified",
    envelope_hash,
  };

  const content = "export const unified = true;\n";
  const file = {
    path: ".goodle/generated/entry.tsx",
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: ["prov-1"],
  };
  const bundleUnsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-unified",
    logical_build_id: "rbi-unified",
    attestation,
    entries: [".goodle/generated/entry.tsx"],
    files: [file],
  };
  const bundle_hash = sha256Json(bundleUnsigned);
  const bundle: TrustedArtifactBundleV1 = {
    ...bundleUnsigned,
    bundle_id: "bundle-unified",
    bundle_hash,
  };

  const snapshotUnsigned = {
    schema: "goodle.governance-snapshot.v1" as const,
    registry_hash: "registry-unified",
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
    policy_hash: "policy-unified",
  };
  const snapshot_hash = sha256Json(snapshotUnsigned);
  const governance_snapshot: GovernanceSnapshotV1 = {
    ...snapshotUnsigned,
    snapshot_id: "governance-unified",
    snapshot_hash,
  };

  const receiptUnsigned = {
    schema: "goodle.trusted-deployment-receipt.v1" as const,
    action: "DEPLOY" as const,
    environment: "staging",
    bundle_id: "bundle-unified",
    build_id: "build-unified",
    logical_build_id: "rbi-unified",
    attestation_id: "attest-unified",
    ledger_hash: record_hash,
    verification: {
      schema: "goodle.trusted-bundle-verification.v1" as const,
      bundle_id: "bundle-unified",
      build_id: "build-unified",
      logical_build_id: "rbi-unified",
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
    receipt_id: "deploy-unified",
    receipt_hash,
  };

  const governance_ledger = appendGovernanceDecision(
    createGovernanceLedger(),
    governance_snapshot,
    receipt,
  );

  return {
    build_ledger,
    attestation,
    bundle,
    governance_snapshot,
    governance_ledger,
  };
}

describe("M33 Unified Trust Proof", () => {
  it("creates and verifies an end-to-end trust proof", () => {
    const f = fixtures();
    const proof = createUnifiedTrustProof(f);
    const verification = verifyUnifiedTrustProof({ proof, ...f });

    expect(proof).toMatchObject({
      schema: "goodle.unified-trust-proof.v1",
      build_id: "build-unified",
      logical_build_id: "rbi-unified",
      bundle_id: "bundle-unified",
      governance_snapshot_id: "governance-unified",
    });
    expect(verification.valid).toBe(true);
    expect(verification.reasons).toEqual([]);
  });

  it("detects broken lineage links even when individual objects are hash-valid", () => {
    const f = fixtures();
    const proof = createUnifiedTrustProof(f);

    const detachedAttestationUnsigned = {
      ...f.attestation,
      trust: {
        ...f.attestation.trust,
        ledger_hash: "other-ledger",
      },
    };
    const {
      attestation_id,
      envelope_hash: _oldHash,
      ...detachedUnsigned
    } = detachedAttestationUnsigned;
    const detachedAttestation = {
      ...detachedUnsigned,
      attestation_id,
      envelope_hash: sha256Json(detachedUnsigned),
    };

    const verification = verifyUnifiedTrustProof({
      proof,
      ...f,
      attestation: detachedAttestation,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("IDENTITY_LINKS_INVALID");
  });

  it("detects proof tampering", () => {
    const f = fixtures();
    const proof = createUnifiedTrustProof(f);

    const verification = verifyUnifiedTrustProof({
      proof: { ...proof, bundle_id: "bundle-tampered" },
      ...f,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("IDENTITY_LINKS_INVALID");
    expect(verification.reasons).toContain("PROOF_HASH_INVALID");
  });
});
