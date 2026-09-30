import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { ExternalComplianceReceiptV1 } from "./ExternalComplianceRegistry";
import { sha256Json } from "./BuildLedger";
import {
  createSignedExternalComplianceAnchor,
  createTrustedAuditorKey,
  verifySignedExternalComplianceAnchor,
} from "./SignedExternalTrustAnchor";

function receipt(): ExternalComplianceReceiptV1 {
  const unsigned = {
    schema: "goodle.external-compliance-receipt.v1" as const,
    audit_package_id: "audit-58",
    package_id: "pkg-58",
    decision: "COMPLIANT" as const,
    acceptable: true,
    review_required: false,
    reasons: [] as string[],
  };

  return {
    ...unsigned,
    receipt_id: "external-compliance-58",
    receipt_hash: sha256Json(unsigned),
  };
}

function keys() {
  const pair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const trusted = createTrustedAuditorKey({
    key_id: "auditor-key-58",
    auditor_id: "external-auditor-58",
    public_key_pem: pair.publicKey,
  });

  return {
    trusted,
    privateKey: pair.privateKey,
  };
}

describe("M58 Signed External Trust Anchor", () => {
  it("signs and verifies a compliance receipt with Ed25519", () => {
    const complianceReceipt = receipt();
    const { trusted, privateKey } = keys();

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: trusted,
      private_key_pem: privateKey,
    });

    expect(anchor).toMatchObject({
      algorithm: "Ed25519",
      key_id: "auditor-key-58",
      auditor_id: "external-auditor-58",
      package_id: "pkg-58",
      decision: "COMPLIANT",
    });

    expect(
      verifySignedExternalComplianceAnchor({
        anchor,
        receipt: complianceReceipt,
        trusted_key: trusted,
      }),
    ).toBe(true);
  });

  it("rejects verification with a different trusted public key", () => {
    const complianceReceipt = receipt();
    const signer = keys();
    const other = keys();

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: signer.trusted,
      private_key_pem: signer.privateKey,
    });

    expect(
      verifySignedExternalComplianceAnchor({
        anchor,
        receipt: complianceReceipt,
        trusted_key: {
          ...other.trusted,
          key_id: signer.trusted.key_id,
          auditor_id: signer.trusted.auditor_id,
        },
      }),
    ).toBe(false);
  });

  it("rejects receipt tampering even when the anchor is unchanged", () => {
    const complianceReceipt = receipt();
    const { trusted, privateKey } = keys();

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: trusted,
      private_key_pem: privateKey,
    });

    expect(
      verifySignedExternalComplianceAnchor({
        anchor,
        receipt: {
          ...complianceReceipt,
          package_id: "pkg-tampered",
        },
        trusted_key: trusted,
      }),
    ).toBe(false);
  });

  it("rejects signature tampering", () => {
    const complianceReceipt = receipt();
    const { trusted, privateKey } = keys();

    const anchor = createSignedExternalComplianceAnchor({
      receipt: complianceReceipt,
      trusted_key: trusted,
      private_key_pem: privateKey,
    });

    expect(
      verifySignedExternalComplianceAnchor({
        anchor: {
          ...anchor,
          signature_base64:
            anchor.signature_base64.slice(0, -4) + "AAAA",
        },
        receipt: complianceReceipt,
        trusted_key: trusted,
      }),
    ).toBe(false);
  });
});
