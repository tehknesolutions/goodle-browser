import { describe, expect, it } from "vitest";
import { createVerifiableQualityAttestationBundle, verifyVerifiableQualityAttestationBundle } from "./VerifiableQualityAttestationBundle";

const report = { schema: "goodle.independent-quality-gate-report.v1", gate: "M70", status: "PASS", git: { commit_sha: "c".repeat(40), tracked_dirty: false }, runtime: { node: "v24", npm: "11", platform: "linux", arch: "x64" }, steps: [] } as any;
const attestation = { schema: "goodle.independent-quality-attestation.v1", gate: "M71", attestation_id: "quality-a", attestation_hash: "a".repeat(64), quality_report: { sha256: "b".repeat(64) }, git: { commit_sha: "c".repeat(40) } } as any;
const signed = { schema: "goodle.signed-independent-quality-attestation.v1", gate: "M72", signed_attestation_id: "signed-a", signed_attestation_hash: "d".repeat(64), quality_attestation_id: "quality-a", quality_attestation_hash: "a".repeat(64), quality_report_sha256: "b".repeat(64), commit_sha: "c".repeat(40), auditor_id: "auditor", key_id: "key-1", algorithm: "Ed25519", public_key_fingerprint_sha256: "e".repeat(64), key_registry_sequence: 1, key_registry_snapshot_hash: "f".repeat(64), key_state_hash: "1".repeat(64), signed_payload_hash: "2".repeat(64), signature_base64: "sig" } as any;
const trustedKey = { schema: "goodle.trusted-auditor-key.v1", key_id: "key-1", auditor_id: "auditor", algorithm: "Ed25519", public_key_pem: "PUBLIC", public_key_fingerprint_sha256: "e".repeat(64) } as any;
const registry = { schema: "goodle.trusted-auditor-key-registry.v1", entries: [{ sequence: 1, entry_hash: "3".repeat(64) }], head_hash: "3".repeat(64) } as any;

describe("M73 Verifiable Quality Attestation Bundle", () => {
  it("creates a deterministic portable bundle binding M70/M71/M72 and trust evidence", () => {
    const bundle = createVerifiableQualityAttestationBundle({ quality_report: report, quality_attestation: attestation, signed_attestation: signed, trusted_key: trustedKey, key_registry: registry });
    expect(bundle.gate).toBe("M73");
    expect(bundle.signed_attestation_id).toBe("signed-a");
    expect(bundle.bundle_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(createVerifiableQualityAttestationBundle({ quality_report: report, quality_attestation: attestation, signed_attestation: signed, trusted_key: trustedKey, key_registry: registry })).toEqual(bundle);
  });

  it("detects tampering of any embedded evidence", () => {
    const bundle = createVerifiableQualityAttestationBundle({ quality_report: report, quality_attestation: attestation, signed_attestation: signed, trusted_key: trustedKey, key_registry: registry });
    const tampered = { ...bundle, signed_attestation: { ...bundle.signed_attestation, signature_base64: "tampered" } };
    const result = verifyVerifiableQualityAttestationBundle(tampered as any);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("QUALITY_BUNDLE_HASH_INVALID");
  });
});
