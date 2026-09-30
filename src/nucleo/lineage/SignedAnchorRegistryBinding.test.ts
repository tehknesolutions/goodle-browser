import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { ExternalComplianceReceiptV1 } from "./ExternalComplianceRegistry";
import {
  createSignedExternalComplianceAnchor,
  createTrustedAuditorKey,
} from "./SignedExternalTrustAnchor";
import {
  createTrustedAuditorKeyRegistry,
  registerTrustedAuditorKey,
  revokeTrustedAuditorKey,
} from "./TrustedAuditorKeyRegistry";
import {
  createSignedAnchorRegistryBinding,
  verifySignedAnchorRegistryBinding,
} from "./SignedAnchorRegistryBinding";

function receipt(): ExternalComplianceReceiptV1 {
  const unsigned = {
    schema: "goodle.external-compliance-receipt.v1" as const,
    audit_package_id: "audit-60",
    package_id: "pkg-60",
    decision: "COMPLIANT" as const,
    acceptable: true,
    review_required: false,
    reasons: [] as string[],
  };

  return {
    ...unsigned,
    receipt_id: "external-compliance-60",
    receipt_hash: sha256Json(unsigned),
  };
}

function signer() {
  const pair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const key = createTrustedAuditorKey({
    key_id: "key-60",
    auditor_id: "auditor-60",
    public_key_pem: pair.publicKey,
  });

  return { key, privateKey: pair.privateKey };
}

describe("M60 Signed Anchor Registry Binding", () => {
  it("proves that the signing key was trusted at a concrete registry sequence", () => {
    const complianceReceipt = receipt();
    const { key, privateKey } = signer();

    const registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key,
    });

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: key,
      private_key_pem: privateKey,
    });

    const binding = createSignedAnchorRegistryBinding({
      anchor,
      receipt: complianceReceipt,
      trusted_key: key,
      key_registry: registry,
      key_registry_sequence: 1,
    });

    expect(binding).toMatchObject({
      package_id: "pkg-60",
      auditor_id: "auditor-60",
      key_id: "key-60",
      key_registry_sequence: 1,
      trusted_at_sequence: true,
    });

    expect(
      verifySignedAnchorRegistryBinding({
        binding,
        anchor,
        receipt: complianceReceipt,
        trusted_key: key,
        key_registry: registry,
      }),
    ).toMatchObject({
      valid: true,
      reasons: [],
    });
  });

  it("preserves historical validity after later revocation", () => {
    const complianceReceipt = receipt();
    const { key, privateKey } = signer();

    let registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key,
    });

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: key,
      private_key_pem: privateKey,
    });

    const binding = createSignedAnchorRegistryBinding({
      anchor,
      receipt: complianceReceipt,
      trusted_key: key,
      key_registry: registry,
      key_registry_sequence: 1,
    });

    registry = revokeTrustedAuditorKey({
      registry,
      key,
      reason_code: "COMPROMISED_AFTER_SIGNING",
    });

    expect(
      verifySignedAnchorRegistryBinding({
        binding: {
          ...binding,
          key_registry_hash: registry.registry_hash,
          binding_hash: sha256Json({
            schema: binding.schema,
            anchor_id: binding.anchor_id,
            anchor_hash: binding.anchor_hash,
            compliance_receipt_id: binding.compliance_receipt_id,
            package_id: binding.package_id,
            auditor_id: binding.auditor_id,
            key_id: binding.key_id,
            key_registry_hash: registry.registry_hash,
            key_registry_sequence: binding.key_registry_sequence,
            trusted_at_sequence: true,
          }),
        },
        anchor,
        receipt: complianceReceipt,
        trusted_key: key,
        key_registry: registry,
      }),
    ).toMatchObject({
      valid: true,
    });
  });

  it("rejects binding at a sequence after revocation", () => {
    const complianceReceipt = receipt();
    const { key, privateKey } = signer();

    let registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key,
    });

    registry = revokeTrustedAuditorKey({
      registry,
      key,
      reason_code: "COMPROMISED",
    });

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: key,
      private_key_pem: privateKey,
    });

    expect(() =>
      createSignedAnchorRegistryBinding({
        anchor,
        receipt: complianceReceipt,
        trusted_key: key,
        key_registry: registry,
        key_registry_sequence: registry.entries.length,
      }),
    ).toThrow("SIGNED_ANCHOR_BINDING_KEY_NOT_TRUSTED_AT_SEQUENCE");
  });

  it("detects sequence tampering", () => {
    const complianceReceipt = receipt();
    const { key, privateKey } = signer();

    const registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key,
    });

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: key,
      private_key_pem: privateKey,
    });

    const binding = createSignedAnchorRegistryBinding({
      anchor,
      receipt: complianceReceipt,
      trusted_key: key,
      key_registry: registry,
      key_registry_sequence: 1,
    });

    const verification = verifySignedAnchorRegistryBinding({
      binding: {
        ...binding,
        key_registry_sequence: 999,
      },
      anchor,
      receipt: complianceReceipt,
      trusted_key: key,
      key_registry: registry,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toEqual(
      expect.arrayContaining([
        "KEY_REGISTRY_SEQUENCE_INVALID",
        "KEY_NOT_TRUSTED_AT_SEQUENCE",
        "ANCHOR_REGISTRY_BINDING_HASH_INVALID",
      ]),
    );
  });
});
