import type {
  SignedExternalComplianceAnchorV1,
  TrustedAuditorKeyV1,
} from "./SignedExternalTrustAnchor";
import { verifySignedExternalComplianceAnchor } from "./SignedExternalTrustAnchor";
import type { ExternalComplianceReceiptV1 } from "./ExternalComplianceRegistry";
import type { TrustedAuditorKeyRegistryV1 } from "./TrustedAuditorKeyRegistry";
import {
  keyWasTrustedAtSequence,
  verifyTrustedAuditorKeyRegistry,
} from "./TrustedAuditorKeyRegistry";
import { sha256Json } from "./BuildLedger";

export type SignedAnchorRegistryBindingV1 = {
  schema: "goodle.signed-anchor-registry-binding.v1";
  binding_id: string;
  anchor_id: string;
  anchor_hash: string;
  compliance_receipt_id: string;
  package_id: string;
  auditor_id: string;
  key_id: string;
  key_registry_hash: string;
  key_registry_sequence: number;
  trusted_at_sequence: true;
  binding_hash: string;
};

export type SignedAnchorRegistryBindingVerificationV1 = {
  schema: "goodle.signed-anchor-registry-binding-verification.v1";
  valid: boolean;
  checks: {
    anchor_signature: boolean;
    key_registry_integrity: boolean;
    registry_sequence_exists: boolean;
    key_trusted_at_sequence: boolean;
    binding_identity: boolean;
    binding_hash: boolean;
  };
  reasons: string[];
};

export function createSignedAnchorRegistryBinding(input: {
  anchor: SignedExternalComplianceAnchorV1;
  receipt: ExternalComplianceReceiptV1;
  trusted_key: TrustedAuditorKeyV1;
  key_registry: TrustedAuditorKeyRegistryV1;
  key_registry_sequence: number;
}): SignedAnchorRegistryBindingV1 {
  if (
    !verifySignedExternalComplianceAnchor({
      anchor: input.anchor,
      receipt: input.receipt,
      trusted_key: input.trusted_key,
    })
  ) {
    throw new Error("SIGNED_ANCHOR_BINDING_ANCHOR_INVALID");
  }

  if (!verifyTrustedAuditorKeyRegistry(input.key_registry)) {
    throw new Error("SIGNED_ANCHOR_BINDING_KEY_REGISTRY_INVALID");
  }

  if (
    input.key_registry_sequence < 1 ||
    input.key_registry_sequence > input.key_registry.entries.length
  ) {
    throw new Error("SIGNED_ANCHOR_BINDING_SEQUENCE_INVALID");
  }

  if (
    !keyWasTrustedAtSequence({
      registry: input.key_registry,
      key: input.trusted_key,
      sequence: input.key_registry_sequence,
    })
  ) {
    throw new Error("SIGNED_ANCHOR_BINDING_KEY_NOT_TRUSTED_AT_SEQUENCE");
  }

  if (
    input.anchor.key_id !== input.trusted_key.key_id ||
    input.anchor.auditor_id !== input.trusted_key.auditor_id ||
    input.anchor.compliance_receipt_id !== input.receipt.receipt_id ||
    input.anchor.package_id !== input.receipt.package_id
  ) {
    throw new Error("SIGNED_ANCHOR_BINDING_IDENTITY_MISMATCH");
  }

  const unsigned = {
    schema: "goodle.signed-anchor-registry-binding.v1" as const,
    anchor_id: input.anchor.anchor_id,
    anchor_hash: input.anchor.anchor_hash,
    compliance_receipt_id: input.receipt.receipt_id,
    package_id: input.receipt.package_id,
    auditor_id: input.trusted_key.auditor_id,
    key_id: input.trusted_key.key_id,
    key_registry_hash: input.key_registry.registry_hash,
    key_registry_sequence: input.key_registry_sequence,
    trusted_at_sequence: true as const,
  };

  const binding_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    binding_id: `anchor-binding-${binding_hash.slice(0, 16)}`,
    binding_hash,
  };
}

export function verifySignedAnchorRegistryBinding(input: {
  binding: SignedAnchorRegistryBindingV1;
  anchor: SignedExternalComplianceAnchorV1;
  receipt: ExternalComplianceReceiptV1;
  trusted_key: TrustedAuditorKeyV1;
  key_registry: TrustedAuditorKeyRegistryV1;
}): SignedAnchorRegistryBindingVerificationV1 {
  const reasons: string[] = [];

  const anchor_signature = verifySignedExternalComplianceAnchor({
    anchor: input.anchor,
    receipt: input.receipt,
    trusted_key: input.trusted_key,
  });

  const key_registry_integrity =
    verifyTrustedAuditorKeyRegistry(input.key_registry);

  const registry_sequence_exists =
    input.binding.key_registry_sequence >= 1 &&
    input.binding.key_registry_sequence <= input.key_registry.entries.length;

  const key_trusted_at_sequence =
    key_registry_integrity &&
    registry_sequence_exists &&
    keyWasTrustedAtSequence({
      registry: input.key_registry,
      key: input.trusted_key,
      sequence: input.binding.key_registry_sequence,
    });

  const binding_identity =
    input.binding.anchor_id === input.anchor.anchor_id &&
    input.binding.anchor_hash === input.anchor.anchor_hash &&
    input.binding.compliance_receipt_id === input.receipt.receipt_id &&
    input.binding.package_id === input.receipt.package_id &&
    input.binding.auditor_id === input.trusted_key.auditor_id &&
    input.binding.key_id === input.trusted_key.key_id &&
    input.binding.key_registry_hash === input.key_registry.registry_hash &&
    input.binding.trusted_at_sequence === true;

  const {
    binding_id: _bindingId,
    binding_hash,
    ...unsigned
  } = input.binding;

  const binding_hash_valid = sha256Json(unsigned) === binding_hash;

  if (!anchor_signature) reasons.push("ANCHOR_SIGNATURE_INVALID");
  if (!key_registry_integrity) reasons.push("KEY_REGISTRY_INVALID");
  if (!registry_sequence_exists) reasons.push("KEY_REGISTRY_SEQUENCE_INVALID");
  if (!key_trusted_at_sequence) reasons.push("KEY_NOT_TRUSTED_AT_SEQUENCE");
  if (!binding_identity) reasons.push("ANCHOR_REGISTRY_BINDING_IDENTITY_INVALID");
  if (!binding_hash_valid) reasons.push("ANCHOR_REGISTRY_BINDING_HASH_INVALID");

  return {
    schema: "goodle.signed-anchor-registry-binding-verification.v1",
    valid:
      anchor_signature &&
      key_registry_integrity &&
      registry_sequence_exists &&
      key_trusted_at_sequence &&
      binding_identity &&
      binding_hash_valid,
    checks: {
      anchor_signature,
      key_registry_integrity,
      registry_sequence_exists,
      key_trusted_at_sequence,
      binding_identity,
      binding_hash: binding_hash_valid,
    },
    reasons,
  };
}
