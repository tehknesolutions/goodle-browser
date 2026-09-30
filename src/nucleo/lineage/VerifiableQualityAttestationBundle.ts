import { sha256Json } from "./BuildLedger";
import type { SignedIndependentQualityAttestationV1 } from "./SignedIndependentQualityAttestation";
import type { TrustedAuditorKeyV1 } from "./SignedExternalTrustAnchor";
import type { TrustedAuditorKeyRegistryV1 } from "./TrustedAuditorKeyRegistry";
import type { IndependentQualityAttestation, QualityGateReport } from "../../../scripts/lib/independent-quality-attestation.mjs";

export type VerifiableQualityAttestationBundleV1 = {
  schema: "goodle.verifiable-quality-attestation-bundle.v1";
  gate: "M73";
  bundle_id: string;
  commit_sha: string;
  quality_attestation_id: string;
  signed_attestation_id: string;
  quality_report: QualityGateReport;
  quality_attestation: IndependentQualityAttestation;
  signed_attestation: SignedIndependentQualityAttestationV1;
  trusted_key: TrustedAuditorKeyV1;
  key_registry: TrustedAuditorKeyRegistryV1;
  bundle_hash: string;
};

export type VerifiableQualityAttestationBundleVerificationV1 = {
  schema: "goodle.verifiable-quality-attestation-bundle-verification.v1";
  valid: boolean;
  reasons: string[];
  bundle_id?: string;
  commit_sha?: string;
};

function unsignedBundle(input: {
  quality_report: QualityGateReport;
  quality_attestation: IndependentQualityAttestation;
  signed_attestation: SignedIndependentQualityAttestationV1;
  trusted_key: TrustedAuditorKeyV1;
  key_registry: TrustedAuditorKeyRegistryV1;
}) {
  return {
    schema: "goodle.verifiable-quality-attestation-bundle.v1" as const,
    gate: "M73" as const,
    commit_sha: input.signed_attestation.commit_sha,
    quality_attestation_id: input.quality_attestation.attestation_id,
    signed_attestation_id: input.signed_attestation.signed_attestation_id,
    quality_report: input.quality_report,
    quality_attestation: input.quality_attestation,
    signed_attestation: input.signed_attestation,
    trusted_key: input.trusted_key,
    key_registry: input.key_registry,
  };
}

export function createVerifiableQualityAttestationBundle(input: {
  quality_report: QualityGateReport;
  quality_attestation: IndependentQualityAttestation;
  signed_attestation: SignedIndependentQualityAttestationV1;
  trusted_key: TrustedAuditorKeyV1;
  key_registry: TrustedAuditorKeyRegistryV1;
}): VerifiableQualityAttestationBundleV1 {
  if (input.signed_attestation.quality_attestation_id !== input.quality_attestation.attestation_id) throw new Error("QUALITY_BUNDLE_M71_M72_BINDING_INVALID");
  if (input.signed_attestation.commit_sha !== input.quality_attestation.git.commit_sha) throw new Error("QUALITY_BUNDLE_COMMIT_BINDING_INVALID");
  if (input.signed_attestation.key_id !== input.trusted_key.key_id || input.signed_attestation.auditor_id !== input.trusted_key.auditor_id) throw new Error("QUALITY_BUNDLE_TRUST_BINDING_INVALID");
  const unsigned = unsignedBundle(input);
  const bundle_hash = sha256Json(unsigned);
  return { ...unsigned, bundle_id: `quality-bundle-${bundle_hash.slice(0, 16)}`, bundle_hash };
}

export function verifyVerifiableQualityAttestationBundle(bundle: VerifiableQualityAttestationBundleV1): VerifiableQualityAttestationBundleVerificationV1 {
  const reasons: string[] = [];
  if (bundle?.schema !== "goodle.verifiable-quality-attestation-bundle.v1") reasons.push("QUALITY_BUNDLE_SCHEMA_INVALID");
  if (bundle?.gate !== "M73") reasons.push("QUALITY_BUNDLE_GATE_INVALID");
  if (bundle?.signed_attestation?.quality_attestation_id !== bundle?.quality_attestation?.attestation_id) reasons.push("QUALITY_BUNDLE_M71_M72_BINDING_INVALID");
  if (bundle?.signed_attestation?.commit_sha !== bundle?.quality_attestation?.git?.commit_sha || bundle?.commit_sha !== bundle?.signed_attestation?.commit_sha) reasons.push("QUALITY_BUNDLE_COMMIT_BINDING_INVALID");
  if (bundle?.signed_attestation?.key_id !== bundle?.trusted_key?.key_id || bundle?.signed_attestation?.auditor_id !== bundle?.trusted_key?.auditor_id) reasons.push("QUALITY_BUNDLE_TRUST_BINDING_INVALID");
  const { bundle_id: _id, bundle_hash, ...unsigned } = bundle;
  const expectedHash = sha256Json(unsigned);
  if (expectedHash !== bundle_hash) reasons.push("QUALITY_BUNDLE_HASH_INVALID");
  if (bundle_id !== `quality-bundle-${expectedHash.slice(0, 16)}`) reasons.push("QUALITY_BUNDLE_ID_INVALID");
  return { schema: "goodle.verifiable-quality-attestation-bundle-verification.v1", valid: reasons.length === 0, reasons, bundle_id: bundle?.bundle_id, commit_sha: bundle?.commit_sha };
}
