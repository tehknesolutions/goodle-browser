import {
  createHash,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import type { ExternalComplianceReceiptV1 } from "./ExternalComplianceRegistry";
import { verifyExternalComplianceReceipt } from "./ExternalComplianceRegistry";
import { sha256Json } from "./BuildLedger";

export type SignedTrustAlgorithm = "Ed25519";

export type TrustedAuditorKeyV1 = {
  schema: "goodle.trusted-auditor-key.v1";
  key_id: string;
  auditor_id: string;
  algorithm: SignedTrustAlgorithm;
  public_key_pem: string;
  public_key_fingerprint_sha256: string;
};

export type SignedExternalComplianceAnchorV1 = {
  schema: "goodle.signed-external-compliance-anchor.v1";
  anchor_id: string;
  compliance_receipt_id: string;
  compliance_receipt_hash: string;
  package_id: string;
  audit_package_id: string;
  decision: ExternalComplianceReceiptV1["decision"];
  key_id: string;
  auditor_id: string;
  algorithm: SignedTrustAlgorithm;
  public_key_fingerprint_sha256: string;
  signed_payload_hash: string;
  signature_base64: string;
  anchor_hash: string;
};

function fingerprintPublicKey(publicKeyPem: string): string {
  const der = createPublicKey(publicKeyPem).export({
    format: "der",
    type: "spki",
  });

  return createHash("sha256").update(der).digest("hex");
}

export function createTrustedAuditorKey(input: {
  key_id: string;
  auditor_id: string;
  public_key_pem: string;
}): TrustedAuditorKeyV1 {
  if (!input.key_id.trim()) {
    throw new Error("TRUSTED_AUDITOR_KEY_ID_REQUIRED");
  }
  if (!input.auditor_id.trim()) {
    throw new Error("TRUSTED_AUDITOR_ID_REQUIRED");
  }

  return {
    schema: "goodle.trusted-auditor-key.v1",
    key_id: input.key_id,
    auditor_id: input.auditor_id,
    algorithm: "Ed25519",
    public_key_pem: input.public_key_pem,
    public_key_fingerprint_sha256: fingerprintPublicKey(
      input.public_key_pem,
    ),
  };
}

function signedPayloadHash(input: {
  receipt: ExternalComplianceReceiptV1;
  key: TrustedAuditorKeyV1;
}): string {
  return sha256Json({
    schema: "goodle.signed-external-compliance-payload.v1",
    compliance_receipt_id: input.receipt.receipt_id,
    compliance_receipt_hash: input.receipt.receipt_hash,
    package_id: input.receipt.package_id,
    audit_package_id: input.receipt.audit_package_id,
    decision: input.receipt.decision,
    key_id: input.key.key_id,
    auditor_id: input.key.auditor_id,
    algorithm: input.key.algorithm,
    public_key_fingerprint_sha256:
      input.key.public_key_fingerprint_sha256,
  });
}

export function createSignedExternalComplianceAnchor(input: {
  receipt: ExternalComplianceReceiptV1;
  trusted_key: TrustedAuditorKeyV1;
  private_key_pem: string;
}): SignedExternalComplianceAnchorV1 {
  if (!verifyExternalComplianceReceipt(input.receipt)) {
    throw new Error("SIGNED_TRUST_COMPLIANCE_RECEIPT_INVALID");
  }

  const actualFingerprint = fingerprintPublicKey(
    input.trusted_key.public_key_pem,
  );
  if (
    actualFingerprint !==
    input.trusted_key.public_key_fingerprint_sha256
  ) {
    throw new Error("SIGNED_TRUST_PUBLIC_KEY_FINGERPRINT_INVALID");
  }

  const payloadHash = signedPayloadHash({
    receipt: input.receipt,
    key: input.trusted_key,
  });

  const signature_base64 = sign(
    null,
    Buffer.from(payloadHash, "utf8"),
    input.private_key_pem,
  ).toString("base64");

  const unsigned = {
    schema: "goodle.signed-external-compliance-anchor.v1" as const,
    compliance_receipt_id: input.receipt.receipt_id,
    compliance_receipt_hash: input.receipt.receipt_hash,
    package_id: input.receipt.package_id,
    audit_package_id: input.receipt.audit_package_id,
    decision: input.receipt.decision,
    key_id: input.trusted_key.key_id,
    auditor_id: input.trusted_key.auditor_id,
    algorithm: input.trusted_key.algorithm,
    public_key_fingerprint_sha256:
      input.trusted_key.public_key_fingerprint_sha256,
    signed_payload_hash: payloadHash,
    signature_base64,
  };

  const anchor_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    anchor_id: `signed-trust-${anchor_hash.slice(0, 16)}`,
    anchor_hash,
  };
}

export function verifySignedExternalComplianceAnchor(input: {
  anchor: SignedExternalComplianceAnchorV1;
  receipt: ExternalComplianceReceiptV1;
  trusted_key: TrustedAuditorKeyV1;
}): boolean {
  if (!verifyExternalComplianceReceipt(input.receipt)) return false;
  if (input.anchor.algorithm !== "Ed25519") return false;
  if (input.trusted_key.algorithm !== "Ed25519") return false;

  const fingerprint = fingerprintPublicKey(
    input.trusted_key.public_key_pem,
  );

  if (
    fingerprint !== input.trusted_key.public_key_fingerprint_sha256 ||
    fingerprint !== input.anchor.public_key_fingerprint_sha256
  ) {
    return false;
  }

  if (
    input.anchor.key_id !== input.trusted_key.key_id ||
    input.anchor.auditor_id !== input.trusted_key.auditor_id ||
    input.anchor.compliance_receipt_id !== input.receipt.receipt_id ||
    input.anchor.compliance_receipt_hash !== input.receipt.receipt_hash ||
    input.anchor.package_id !== input.receipt.package_id ||
    input.anchor.audit_package_id !== input.receipt.audit_package_id ||
    input.anchor.decision !== input.receipt.decision
  ) {
    return false;
  }

  const expectedPayloadHash = signedPayloadHash({
    receipt: input.receipt,
    key: input.trusted_key,
  });

  if (input.anchor.signed_payload_hash !== expectedPayloadHash) {
    return false;
  }

  const signatureValid = verify(
    null,
    Buffer.from(expectedPayloadHash, "utf8"),
    input.trusted_key.public_key_pem,
    Buffer.from(input.anchor.signature_base64, "base64"),
  );

  if (!signatureValid) return false;

  const {
    anchor_id: _anchorId,
    anchor_hash,
    ...unsigned
  } = input.anchor;

  return sha256Json(unsigned) === anchor_hash;
}
