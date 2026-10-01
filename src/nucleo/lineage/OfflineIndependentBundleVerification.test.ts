import { describe, expect, it } from "vitest";
import { verifyOfflineIndependentBundle } from "./OfflineIndependentBundleVerification";

const baseBundle = {
  schema: "goodle.verifiable-quality-attestation-bundle.v1",
  gate: "M73",
  bundle_id: "quality-bundle-demo",
  commit_sha: "abc123",
  quality_attestation_id: "qa-1",
  signed_attestation_id: "signed-1",
  quality_report: {},
  quality_attestation: { attestation_id: "qa-1", git: { commit_sha: "abc123" } },
  signed_attestation: { quality_attestation_id: "qa-1", signed_attestation_id: "signed-1", commit_sha: "abc123", key_id: "key-1", auditor_id: "auditor-1" },
  trusted_key: { key_id: "key-1", auditor_id: "auditor-1" },
  key_registry: {},
  bundle_hash: "demo",
} as any;

describe("M74 offline independent bundle verification", () => {
  it("rejects a bundle whose M73 integrity verification fails without any network dependency", () => {
    const result = verifyOfflineIndependentBundle(baseBundle);
    expect(result.schema).toBe("goodle.offline-independent-bundle-verification.v1");
    expect(result.gate).toBe("M74");
    expect(result.valid).toBe(false);
    expect(result.network_required).toBe(false);
    expect(result.reasons).toContain("M73_QUALITY_BUNDLE_HASH_INVALID");
  });

  it("rejects commit substitution before trusting embedded evidence", () => {
    const result = verifyOfflineIndependentBundle({ ...baseBundle, commit_sha: "evil" });
    expect(result.valid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes("COMMIT"))).toBe(true);
  });
});
