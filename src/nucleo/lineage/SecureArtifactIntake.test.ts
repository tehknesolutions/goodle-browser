import { describe, expect, it } from "vitest";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type { TrustProofConsumerResultV1 } from "./TrustProofConsumer";
import {
  intakeArtifact,
  releaseQuarantinedArtifact,
  verifyQuarantineRecord,
  verifyQuarantineReleaseReceipt,
} from "./SecureArtifactIntake";

function bundle(): TrustedArtifactBundleV1 {
  return {
    schema: "goodle.trusted-artifact-bundle.v1",
    bundle_id: "bundle-1",
    build_id: "build-1",
    logical_build_id: "rbi-1",
    attestation: {
      schema: "goodle.build-attestation.v1",
      attestation_id: "attest-1",
      build_id: "build-1",
      logical_build_id: "rbi-1",
      graph_id: "graph-1",
      target: { kind: "web", adapter: "react", version: "19" },
      certification_status: "CERTIFIED",
      trust: {
        report_hash: "report",
        certification_hash: "cert",
        ledger_hash: "ledger",
        identity_hash: "identity",
      },
      provenance_refs: [],
      artifact_entries: [],
      envelope_hash: "attestation-hash",
    },
    entries: [],
    files: [],
    bundle_hash: "bundle-hash",
  };
}

function proof(): UnifiedTrustProofV1 {
  return {
    schema: "goodle.unified-trust-proof.v1",
    proof_id: "proof-1",
    build_id: "build-1",
    logical_build_id: "rbi-1",
    bundle_id: "bundle-1",
    governance_snapshot_id: "snapshot-1",
    build_ledger_hash: "ledger",
    attestation_hash: "attestation-hash",
    bundle_hash: "bundle-hash",
    governance_snapshot_hash: "snapshot-hash",
    governance_ledger_hash: "gov-ledger",
    governance_ledger_head_hash: "gov-head",
    proof_hash: "proof-hash",
  };
}

function result(
  decision: "TRUSTED" | "QUARANTINED" | "REJECTED",
): TrustProofConsumerResultV1 {
  return {
    schema: "goodle.trust-proof-consumer-result.v1",
    proof_id: "proof-1",
    decision,
    executable: decision === "TRUSTED",
    reasons:
      decision === "TRUSTED"
        ? []
        : [decision === "QUARANTINED" ? "ENVIRONMENT_MISMATCH" : "PROOF_HASH_INVALID"],
    verification: {
      schema: "goodle.unified-trust-proof-verification.v1",
      valid: decision !== "REJECTED",
      checks: {
        build_ledger: true,
        attestation: true,
        bundle: true,
        release: true,
        governance_snapshot: true,
        governance_ledger: true,
        identity_links: decision !== "REJECTED",
        proof_hash: decision !== "REJECTED",
      },
      reasons: decision === "REJECTED" ? ["PROOF_HASH_INVALID"] : [],
    },
  };
}

describe("M35 Secure Artifact Intake", () => {
  it("accepts trusted artifacts without quarantine", () => {
    const intake = intakeArtifact({
      proof: proof(),
      bundle: bundle(),
      consumer_result: result("TRUSTED"),
    });

    expect(intake).toMatchObject({
      disposition: "ACCEPTED",
      executable: true,
    });
    expect(intake.quarantine_record).toBeUndefined();
  });

  it("isolates quarantined artifacts and preserves evidence", () => {
    const intake = intakeArtifact({
      proof: proof(),
      bundle: bundle(),
      consumer_result: result("QUARANTINED"),
    });

    expect(intake).toMatchObject({
      disposition: "QUARANTINED",
      executable: false,
      quarantine_record: {
        proof_id: "proof-1",
        proof_hash: "proof-hash",
        bundle_id: "bundle-1",
        bundle_hash: "bundle-hash",
        status: "HELD",
        executable: false,
      },
    });
    expect(verifyQuarantineRecord(intake.quarantine_record!)).toBe(true);
  });

  it("isolates rejected artifacts as non-executable evidence", () => {
    const intake = intakeArtifact({
      proof: proof(),
      bundle: bundle(),
      consumer_result: result("REJECTED"),
    });

    expect(intake.disposition).toBe("REJECTED");
    expect(intake.executable).toBe(false);
    expect(intake.quarantine_record?.decision).toBe("REJECTED");
  });

  it("releases a held artifact only after a trusted review", () => {
    const intake = intakeArtifact({
      proof: proof(),
      bundle: bundle(),
      consumer_result: result("QUARANTINED"),
    });

    const released = releaseQuarantinedArtifact({
      record: intake.quarantine_record!,
      reviewed_consumer_result: result("TRUSTED"),
    });

    expect(released.record.status).toBe("RELEASED");
    expect(released.record.executable).toBe(false);
    expect(released.release_receipt).toMatchObject({
      proof_id: "proof-1",
      bundle_id: "bundle-1",
      review_decision: "TRUSTED",
      status: "RELEASED",
    });
    expect(verifyQuarantineReleaseReceipt(released.release_receipt)).toBe(true);
  });

  it("refuses release while review is still quarantined", () => {
    const intake = intakeArtifact({
      proof: proof(),
      bundle: bundle(),
      consumer_result: result("QUARANTINED"),
    });

    expect(() =>
      releaseQuarantinedArtifact({
        record: intake.quarantine_record!,
        reviewed_consumer_result: result("QUARANTINED"),
      }),
    ).toThrow("QUARANTINE_RELEASE_REQUIRES_TRUSTED_REVIEW");
  });
});
