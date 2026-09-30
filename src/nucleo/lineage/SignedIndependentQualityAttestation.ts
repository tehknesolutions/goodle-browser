import { createHash, createPublicKey, sign, verify } from "node:crypto";
import { sha256Json } from "./BuildLedger";
import type { TrustedAuditorKeyV1 } from "./SignedExternalTrustAnchor";
import type { TrustedAuditorKeyRegistryV1 } from "./TrustedAuditorKeyRegistry";
import {
  deriveAuditorKeyStateAtSequence,
  keyWasTrustedAtSequence,
  verifyTrustedAuditorKeyRegistry,
} from "./TrustedAuditorKeyRegistry";
import {
  verifyIndependentQualityAttestation,
  type IndependentQualityAttestation,
  type QualityGateReport,
} from "../../../scripts/lib/independent-quality-attestation.mjs";

export type SignedIndependentQualityAttestationV1 = {
  schema: "goodle.signed-independent-quality-attestation.v1";
  gate: "M72";
  signed_attestation_id: string;
  quality_attestation_id: string;
  quality_attestation_hash: string;
  quality_report_sha256: string;
  commit_sha: string;
  auditor_id: string;
  key_id: string;
  algorithm: "Ed25519";
  public_key_fingerprint_sha256: string;
  key_registry_sequence: number;
  key_registry_head_hash?: string;
  key_registry_snapshot_hash: string;
  key_state_hash: string;
  signed_payload_hash: string;
  signature_base64: string;
  signed_attestation_hash: string;
};

export type SignedIndependentQualityVerificationV1 = {
  schema: "goodle.signed-independent-quality-attestation-verification.v1";
  valid: boolean;
  reasons: string[];
  signed_attestation_id?: string;
  commit_sha?: string;
};

function fingerprintPublicKey(publicKeyPem: string): string {
  const der = createPublicKey(publicKeyPem).export({
    format: "der",
    type: "spki",
  });
  return createHash("sha256").update(der).digest("hex");
}

function registrySnapshotAtSequence(
  registry: TrustedAuditorKeyRegistryV1,
  sequence: number,
) {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > registry.entries.length) {
    throw new Error("SIGNED_QUALITY_REGISTRY_SEQUENCE_INVALID");
  }
  const entries = registry.entries.slice(0, sequence).map((entry) => ({
    ...entry,
    previous_entry_hash: entry.previous_entry_hash,
  }));
  const head_hash = entries.at(-1)?.entry_hash;
  const registry_hash = sha256Json({
    schema: "goodle.trusted-auditor-key-registry.v1",
    entries,
    head_hash,
  });
  return { head_hash, registry_hash };
}

function payloadHash(input: {
  quality_attestation: IndependentQualityAttestation;
  trusted_key: TrustedAuditorKeyV1;
  registry: TrustedAuditorKeyRegistryV1;
  sequence: number;
  key_state_hash: string;
}) {
  const snapshot = registrySnapshotAtSequence(input.registry, input.sequence);
  return sha256Json({
    schema: "goodle.signed-independent-quality-payload.v1",
    quality_attestation_id: input.quality_attestation.attestation_id,
    quality_attestation_hash: input.quality_attestation.attestation_hash,
    quality_report_sha256: input.quality_attestation.quality_report.sha256,
    commit_sha: input.quality_attestation.git.commit_sha,
    auditor_id: input.trusted_key.auditor_id,
    key_id: input.trusted_key.key_id,
    algorithm: input.trusted_key.algorithm,
    public_key_fingerprint_sha256:
      input.trusted_key.public_key_fingerprint_sha256,
    key_registry_sequence: input.sequence,
    key_registry_head_hash: snapshot.head_hash,
    key_registry_snapshot_hash: snapshot.registry_hash,
    key_state_hash: input.key_state_hash,
  });
}

export function createSignedIndependentQualityAttestation(input: {
  quality_attestation: IndependentQualityAttestation;
  quality_report: QualityGateReport;
  report_sha256: string;
  trusted_key: TrustedAuditorKeyV1;
  key_registry: TrustedAuditorKeyRegistryV1;
  private_key_pem: string;
  expected_commit_sha?: string;
}): SignedIndependentQualityAttestationV1 {
  const m71 = verifyIndependentQualityAttestation({
    attestation: input.quality_attestation,
    report: input.quality_report,
    reportSha256: input.report_sha256,
    expectedCommitSha: input.expected_commit_sha,
  });
  if (!m71.valid) {
    throw new Error(`SIGNED_QUALITY_M71_INVALID:${m71.reasons.join(",")}`);
  }
  if (!verifyTrustedAuditorKeyRegistry(input.key_registry)) {
    throw new Error("SIGNED_QUALITY_KEY_REGISTRY_INVALID");
  }
  if (input.trusted_key.algorithm !== "Ed25519") {
    throw new Error("SIGNED_QUALITY_ALGORITHM_UNSUPPORTED");
  }

  const fingerprint = fingerprintPublicKey(input.trusted_key.public_key_pem);
  if (fingerprint !== input.trusted_key.public_key_fingerprint_sha256) {
    throw new Error("SIGNED_QUALITY_PUBLIC_KEY_FINGERPRINT_INVALID");
  }

  const sequence = input.key_registry.entries.length;
  if (
    !keyWasTrustedAtSequence({
      registry: input.key_registry,
      key: input.trusted_key,
      sequence,
    })
  ) {
    throw new Error("SIGNED_QUALITY_KEY_NOT_ACTIVE");
  }

  const state = deriveAuditorKeyStateAtSequence(
    input.key_registry,
    input.trusted_key.key_id,
    sequence,
  );
  if (!state || state.status !== "ACTIVE") {
    throw new Error("SIGNED_QUALITY_KEY_NOT_ACTIVE");
  }

  const snapshot = registrySnapshotAtSequence(input.key_registry, sequence);
  const signed_payload_hash = payloadHash({
    quality_attestation: input.quality_attestation,
    trusted_key: input.trusted_key,
    registry: input.key_registry,
    sequence,
    key_state_hash: state.state_hash,
  });
  const signature_base64 = sign(
    null,
    Buffer.from(signed_payload_hash, "utf8"),
    input.private_key_pem,
  ).toString("base64");

  const signatureValid = verify(
    null,
    Buffer.from(signed_payload_hash, "utf8"),
    input.trusted_key.public_key_pem,
    Buffer.from(signature_base64, "base64"),
  );
  if (!signatureValid) {
    throw new Error("SIGNED_QUALITY_PRIVATE_PUBLIC_KEY_MISMATCH");
  }

  const unsigned = {
    schema: "goodle.signed-independent-quality-attestation.v1" as const,
    gate: "M72" as const,
    quality_attestation_id: input.quality_attestation.attestation_id,
    quality_attestation_hash: input.quality_attestation.attestation_hash,
    quality_report_sha256: input.quality_attestation.quality_report.sha256,
    commit_sha: input.quality_attestation.git.commit_sha,
    auditor_id: input.trusted_key.auditor_id,
    key_id: input.trusted_key.key_id,
    algorithm: "Ed25519" as const,
    public_key_fingerprint_sha256:
      input.trusted_key.public_key_fingerprint_sha256,
    key_registry_sequence: sequence,
    key_registry_head_hash: snapshot.head_hash,
    key_registry_snapshot_hash: snapshot.registry_hash,
    key_state_hash: state.state_hash,
    signed_payload_hash,
    signature_base64,
  };
  const signed_attestation_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    signed_attestation_id: `signed-quality-${signed_attestation_hash.slice(0, 16)}`,
    signed_attestation_hash,
  };
}

export function verifySignedIndependentQualityAttestation(input: {
  signed_attestation: SignedIndependentQualityAttestationV1;
  quality_attestation: IndependentQualityAttestation;
  quality_report: QualityGateReport;
  report_sha256: string;
  trusted_key: TrustedAuditorKeyV1;
  key_registry: TrustedAuditorKeyRegistryV1;
  expected_commit_sha?: string;
}): SignedIndependentQualityVerificationV1 {
  const reasons: string[] = [];
  const signed = input.signed_attestation;

  const m71 = verifyIndependentQualityAttestation({
    attestation: input.quality_attestation,
    report: input.quality_report,
    reportSha256: input.report_sha256,
    expectedCommitSha: input.expected_commit_sha,
  });
  if (!m71.valid) reasons.push(...m71.reasons.map((reason) => `M71_${reason}`));

  if (signed?.schema !== "goodle.signed-independent-quality-attestation.v1") {
    reasons.push("SIGNED_QUALITY_SCHEMA_INVALID");
  }
  if (signed?.gate !== "M72") reasons.push("SIGNED_QUALITY_GATE_INVALID");
  if (!verifyTrustedAuditorKeyRegistry(input.key_registry)) {
    reasons.push("SIGNED_QUALITY_KEY_REGISTRY_INVALID");
    return {
      schema: "goodle.signed-independent-quality-attestation-verification.v1",
      valid: false,
      reasons,
      signed_attestation_id: signed?.signed_attestation_id,
      commit_sha: signed?.commit_sha,
    };
  }

  const fingerprint = fingerprintPublicKey(input.trusted_key.public_key_pem);
  if (
    fingerprint !== input.trusted_key.public_key_fingerprint_sha256 ||
    fingerprint !== signed.public_key_fingerprint_sha256
  ) {
    reasons.push("SIGNED_QUALITY_PUBLIC_KEY_FINGERPRINT_INVALID");
  }

  if (
    signed.quality_attestation_id !== input.quality_attestation.attestation_id ||
    signed.quality_attestation_hash !== input.quality_attestation.attestation_hash ||
    signed.quality_report_sha256 !== input.quality_attestation.quality_report.sha256 ||
    signed.commit_sha !== input.quality_attestation.git.commit_sha
  ) {
    reasons.push("SIGNED_QUALITY_M71_BINDING_INVALID");
  }
  if (
    signed.key_id !== input.trusted_key.key_id ||
    signed.auditor_id !== input.trusted_key.auditor_id ||
    signed.algorithm !== "Ed25519"
  ) {
    reasons.push("SIGNED_QUALITY_KEY_IDENTITY_INVALID");
  }
  if (input.expected_commit_sha && signed.commit_sha !== input.expected_commit_sha) {
    reasons.push("SIGNED_QUALITY_COMMIT_MISMATCH");
  }

  let snapshot;
  let state;
  try {
    snapshot = registrySnapshotAtSequence(
      input.key_registry,
      signed.key_registry_sequence,
    );
    state = deriveAuditorKeyStateAtSequence(
      input.key_registry,
      input.trusted_key.key_id,
      signed.key_registry_sequence,
    );
  } catch {
    reasons.push("SIGNED_QUALITY_REGISTRY_SEQUENCE_INVALID");
  }

  if (
    snapshot &&
    (snapshot.head_hash !== signed.key_registry_head_hash ||
      snapshot.registry_hash !== signed.key_registry_snapshot_hash)
  ) {
    reasons.push("SIGNED_QUALITY_REGISTRY_SNAPSHOT_INVALID");
  }
  if (!state || state.status !== "ACTIVE") {
    reasons.push("SIGNED_QUALITY_KEY_NOT_ACTIVE_AT_SIGNING");
  } else if (state.state_hash !== signed.key_state_hash) {
    reasons.push("SIGNED_QUALITY_KEY_STATE_INVALID");
  }

  if (
    state &&
    !keyWasTrustedAtSequence({
      registry: input.key_registry,
      key: input.trusted_key,
      sequence: signed.key_registry_sequence,
    })
  ) {
    reasons.push("SIGNED_QUALITY_KEY_TRUST_INVALID");
  }

  if (state) {
    const expectedPayloadHash = payloadHash({
      quality_attestation: input.quality_attestation,
      trusted_key: input.trusted_key,
      registry: input.key_registry,
      sequence: signed.key_registry_sequence,
      key_state_hash: state.state_hash,
    });
    if (expectedPayloadHash !== signed.signed_payload_hash) {
      reasons.push("SIGNED_QUALITY_PAYLOAD_HASH_INVALID");
    } else {
      const signatureValid = verify(
        null,
        Buffer.from(expectedPayloadHash, "utf8"),
        input.trusted_key.public_key_pem,
        Buffer.from(signed.signature_base64, "base64"),
      );
      if (!signatureValid) reasons.push("SIGNED_QUALITY_SIGNATURE_INVALID");
    }
  }

  const {
    signed_attestation_id: _id,
    signed_attestation_hash,
    ...unsigned
  } = signed;
  const expectedHash = sha256Json(unsigned);
  if (expectedHash !== signed_attestation_hash) {
    reasons.push("SIGNED_QUALITY_ATTESTATION_HASH_INVALID");
  }
  if (signed_attestation_idOrFallback(signed) !== `signed-quality-${expectedHash.slice(0, 16)}`) {
    reasons.push("SIGNED_QUALITY_ATTESTATION_ID_INVALID");
  }

  return {
    schema: "goodle.signed-independent-quality-attestation-verification.v1",
    valid: reasons.length === 0,
    reasons,
    signed_attestation_id: signed.signed_attestation_id,
    commit_sha: signed.commit_sha,
  };
}

function signed_attestation_idOrFallback(
  signed: SignedIndependentQualityAttestationV1,
): string {
  return signed?.signed_attestation_id ?? "";
}
