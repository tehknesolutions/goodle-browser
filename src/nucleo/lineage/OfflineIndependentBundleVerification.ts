import type { VerifiableQualityAttestationBundleV1 } from "./VerifiableQualityAttestationBundle";
import { verifyVerifiableQualityAttestationBundle } from "./VerifiableQualityAttestationBundle";
import { verifySignedIndependentQualityAttestation } from "./SignedIndependentQualityAttestation";

export type OfflineIndependentBundleVerificationV1 = {
  schema: "goodle.offline-independent-bundle-verification.v1";
  gate: "M74";
  valid: boolean;
  network_required: false;
  reasons: string[];
  bundle_id?: string;
  commit_sha?: string;
};

export function verifyOfflineIndependentBundle(
  bundle: VerifiableQualityAttestationBundleV1,
): OfflineIndependentBundleVerificationV1 {
  const reasons: string[] = [];

  const m73 = verifyVerifiableQualityAttestationBundle(bundle);
  if (!m73.valid) reasons.push(...m73.reasons.map((reason) => `M73_${reason}`));

  if (bundle?.commit_sha !== bundle?.quality_attestation?.git?.commit_sha ||
      bundle?.commit_sha !== bundle?.signed_attestation?.commit_sha) {
    reasons.push("OFFLINE_BUNDLE_COMMIT_BINDING_INVALID");
  }

  try {
    const reportSha = bundle?.quality_attestation?.quality_report?.sha256;
    if (!reportSha) {
      reasons.push("OFFLINE_BUNDLE_REPORT_HASH_MISSING");
    } else {
      const m72 = verifySignedIndependentQualityAttestation({
        signed_attestation: bundle.signed_attestation,
        quality_attestation: bundle.quality_attestation,
        quality_report: bundle.quality_report,
        report_sha256: reportSha,
        trusted_key: bundle.trusted_key,
        key_registry: bundle.key_registry,
        expected_commit_sha: bundle.commit_sha,
      });
      if (!m72.valid) reasons.push(...m72.reasons.map((reason) => `M72_${reason}`));
    }
  } catch (error) {
    reasons.push(`OFFLINE_BUNDLE_CRYPTOGRAPHIC_VERIFICATION_FAILED:${error instanceof Error ? error.message : "UNKNOWN"}`);
  }

  return {
    schema: "goodle.offline-independent-bundle-verification.v1",
    gate: "M74",
    valid: reasons.length === 0,
    network_required: false,
    reasons,
    bundle_id: bundle?.bundle_id,
    commit_sha: bundle?.commit_sha,
  };
}
