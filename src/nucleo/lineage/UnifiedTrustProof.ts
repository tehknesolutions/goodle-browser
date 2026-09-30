import type { BuildLedgerRecordV1 } from "./BuildLedger";
import { sha256Json, verifyBuildLedgerRecord } from "./BuildLedger";
import type { BuildAttestationV1 } from "./BuildAttestation";
import { verifyBuildAttestation } from "./BuildAttestation";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { verifyTrustedArtifactBundle } from "./TrustedArtifactBundle";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import { verifyReleaseManifest } from "./ReleaseManifest";
import type { GovernanceSnapshotV1 } from "./GovernanceSnapshot";
import { verifyGovernanceSnapshot } from "./GovernanceSnapshot";
import type { GovernanceLedgerV1 } from "./GovernanceLedger";
import { verifyGovernanceLedger } from "./GovernanceLedger";

export type UnifiedTrustProofV1 = {
  schema: "goodle.unified-trust-proof.v1";
  proof_id: string;
  build_id: string;
  logical_build_id: string;
  bundle_id: string;
  release_id?: string;
  governance_snapshot_id: string;
  build_ledger_hash: string;
  attestation_hash: string;
  bundle_hash: string;
  release_hash?: string;
  governance_snapshot_hash: string;
  governance_ledger_hash: string;
  governance_ledger_head_hash?: string;
  proof_hash: string;
};

export type UnifiedTrustProofVerificationV1 = {
  schema: "goodle.unified-trust-proof-verification.v1";
  valid: boolean;
  checks: {
    build_ledger: boolean;
    attestation: boolean;
    bundle: boolean;
    release: boolean;
    governance_snapshot: boolean;
    governance_ledger: boolean;
    identity_links: boolean;
    proof_hash: boolean;
  };
  reasons: string[];
};

export function createUnifiedTrustProof(input: {
  build_ledger: BuildLedgerRecordV1;
  attestation: BuildAttestationV1;
  bundle: TrustedArtifactBundleV1;
  release?: ReleaseManifestV1;
  governance_snapshot: GovernanceSnapshotV1;
  governance_ledger: GovernanceLedgerV1;
}): UnifiedTrustProofV1 {
  if (!verifyBuildLedgerRecord(input.build_ledger)) {
    throw new Error("UNIFIED_TRUST_BUILD_LEDGER_INVALID");
  }
  if (!verifyBuildAttestation(input.attestation)) {
    throw new Error("UNIFIED_TRUST_ATTESTATION_INVALID");
  }
  if (!verifyTrustedArtifactBundle(input.bundle).valid) {
    throw new Error("UNIFIED_TRUST_BUNDLE_INVALID");
  }
  if (input.release && !verifyReleaseManifest(input.release)) {
    throw new Error("UNIFIED_TRUST_RELEASE_INVALID");
  }
  if (!verifyGovernanceSnapshot(input.governance_snapshot)) {
    throw new Error("UNIFIED_TRUST_GOVERNANCE_SNAPSHOT_INVALID");
  }
  if (!verifyGovernanceLedger(input.governance_ledger)) {
    throw new Error("UNIFIED_TRUST_GOVERNANCE_LEDGER_INVALID");
  }

  if (input.build_ledger.build_id !== input.attestation.build_id) {
    throw new Error("UNIFIED_TRUST_BUILD_ID_MISMATCH");
  }
  if (input.attestation.trust.ledger_hash !== input.build_ledger.record_hash) {
    throw new Error("UNIFIED_TRUST_LEDGER_LINK_MISMATCH");
  }
  if (input.bundle.attestation.attestation_id !== input.attestation.attestation_id) {
    throw new Error("UNIFIED_TRUST_ATTESTATION_LINK_MISMATCH");
  }
  if (input.bundle.logical_build_id !== input.attestation.logical_build_id) {
    throw new Error("UNIFIED_TRUST_LOGICAL_BUILD_MISMATCH");
  }
  if (
    input.release &&
    (
      input.release.bundle_id !== input.bundle.bundle_id ||
      input.release.logical_build_id !== input.bundle.logical_build_id
    )
  ) {
    throw new Error("UNIFIED_TRUST_RELEASE_LINK_MISMATCH");
  }

  const snapshotEntry = input.governance_ledger.entries.find(
    (entry) =>
      entry.snapshot_id === input.governance_snapshot.snapshot_id &&
      entry.snapshot_hash === input.governance_snapshot.snapshot_hash,
  );
  if (!snapshotEntry) {
    throw new Error("UNIFIED_TRUST_GOVERNANCE_LEDGER_LINK_MISMATCH");
  }

  const unsigned = {
    schema: "goodle.unified-trust-proof.v1" as const,
    build_id: input.bundle.build_id,
    logical_build_id: input.bundle.logical_build_id,
    bundle_id: input.bundle.bundle_id,
    release_id: input.release?.release_id,
    governance_snapshot_id: input.governance_snapshot.snapshot_id,
    build_ledger_hash: input.build_ledger.record_hash,
    attestation_hash: input.attestation.envelope_hash,
    bundle_hash: input.bundle.bundle_hash,
    release_hash: input.release?.release_hash,
    governance_snapshot_hash: input.governance_snapshot.snapshot_hash,
    governance_ledger_hash: input.governance_ledger.ledger_hash,
    governance_ledger_head_hash: input.governance_ledger.head_hash,
  };

  const proof_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    proof_id: `trust-proof-${proof_hash.slice(0, 16)}`,
    proof_hash,
  };
}

export function verifyUnifiedTrustProof(input: {
  proof: UnifiedTrustProofV1;
  build_ledger: BuildLedgerRecordV1;
  attestation: BuildAttestationV1;
  bundle: TrustedArtifactBundleV1;
  release?: ReleaseManifestV1;
  governance_snapshot: GovernanceSnapshotV1;
  governance_ledger: GovernanceLedgerV1;
}): UnifiedTrustProofVerificationV1 {
  const reasons: string[] = [];

  const build_ledger = verifyBuildLedgerRecord(input.build_ledger);
  const attestation = verifyBuildAttestation(input.attestation);
  const bundle = verifyTrustedArtifactBundle(input.bundle).valid;
  const release = input.release ? verifyReleaseManifest(input.release) : true;
  const governance_snapshot = verifyGovernanceSnapshot(input.governance_snapshot);
  const governance_ledger = verifyGovernanceLedger(input.governance_ledger);

  if (!build_ledger) reasons.push("BUILD_LEDGER_INVALID");
  if (!attestation) reasons.push("ATTESTATION_INVALID");
  if (!bundle) reasons.push("BUNDLE_INVALID");
  if (!release) reasons.push("RELEASE_INVALID");
  if (!governance_snapshot) reasons.push("GOVERNANCE_SNAPSHOT_INVALID");
  if (!governance_ledger) reasons.push("GOVERNANCE_LEDGER_INVALID");

  const snapshotEntry = input.governance_ledger.entries.find(
    (entry) =>
      entry.snapshot_id === input.governance_snapshot.snapshot_id &&
      entry.snapshot_hash === input.governance_snapshot.snapshot_hash,
  );

  const identity_links =
    input.proof.build_id === input.build_ledger.build_id &&
    input.build_ledger.build_id === input.attestation.build_id &&
    input.attestation.trust.ledger_hash === input.build_ledger.record_hash &&
    input.bundle.attestation.attestation_id === input.attestation.attestation_id &&
    input.bundle.logical_build_id === input.attestation.logical_build_id &&
    input.proof.logical_build_id === input.bundle.logical_build_id &&
    input.proof.bundle_id === input.bundle.bundle_id &&
    input.proof.governance_snapshot_id === input.governance_snapshot.snapshot_id &&
    Boolean(snapshotEntry) &&
    (
      input.release
        ? (
            input.proof.release_id === input.release.release_id &&
            input.release.bundle_id === input.bundle.bundle_id &&
            input.release.logical_build_id === input.bundle.logical_build_id
          )
        : input.proof.release_id === undefined
    );

  if (!identity_links) reasons.push("IDENTITY_LINKS_INVALID");

  const {
    proof_id: _proofId,
    proof_hash,
    ...unsigned
  } = input.proof;
  const proof_hash_valid =
    sha256Json(unsigned) === proof_hash &&
    input.proof.build_ledger_hash === input.build_ledger.record_hash &&
    input.proof.attestation_hash === input.attestation.envelope_hash &&
    input.proof.bundle_hash === input.bundle.bundle_hash &&
    input.proof.release_hash === input.release?.release_hash &&
    input.proof.governance_snapshot_hash === input.governance_snapshot.snapshot_hash &&
    input.proof.governance_ledger_hash === input.governance_ledger.ledger_hash &&
    input.proof.governance_ledger_head_hash === input.governance_ledger.head_hash;

  if (!proof_hash_valid) reasons.push("PROOF_HASH_INVALID");

  return {
    schema: "goodle.unified-trust-proof-verification.v1",
    valid:
      build_ledger &&
      attestation &&
      bundle &&
      release &&
      governance_snapshot &&
      governance_ledger &&
      identity_links &&
      proof_hash_valid,
    checks: {
      build_ledger,
      attestation,
      bundle,
      release,
      governance_snapshot,
      governance_ledger,
      identity_links,
      proof_hash: proof_hash_valid,
    },
    reasons,
  };
}
