import type { DistributionAuditPackageV1 } from "./DistributionAuditPackage";
import { verifyDistributionAuditPackage } from "./DistributionAuditPackage";
import type {
  ExternalAuditCompliancePolicyV1,
  ExternalAuditComplianceResultV1,
} from "./ExternalAuditComplianceGate";
import { evaluateExternalAuditCompliance } from "./ExternalAuditComplianceGate";
import type {
  ExternalComplianceReceiptV1,
  ExternalTrustRegistryV1,
} from "./ExternalComplianceRegistry";
import {
  verifyExternalComplianceReceipt,
  verifyExternalTrustRegistry,
} from "./ExternalComplianceRegistry";
import type {
  SignedExternalComplianceAnchorV1,
  TrustedAuditorKeyV1,
} from "./SignedExternalTrustAnchor";
import { verifySignedExternalComplianceAnchor } from "./SignedExternalTrustAnchor";
import type { TrustedAuditorKeyRegistryV1 } from "./TrustedAuditorKeyRegistry";
import { verifyTrustedAuditorKeyRegistry } from "./TrustedAuditorKeyRegistry";
import type { SignedAnchorRegistryBindingV1 } from "./SignedAnchorRegistryBinding";
import { verifySignedAnchorRegistryBinding } from "./SignedAnchorRegistryBinding";
import { sha256Json } from "./BuildLedger";

export type EndToEndExternalTrustProofV1 = {
  schema: "goodle.end-to-end-external-trust-proof.v1";
  proof_id: string;
  package_id: string;
  package_hash: string;
  audit_package: DistributionAuditPackageV1;
  compliance_policy: ExternalAuditCompliancePolicyV1;
  compliance_result: ExternalAuditComplianceResultV1;
  compliance_receipt: ExternalComplianceReceiptV1;
  external_trust_registry: ExternalTrustRegistryV1;
  signed_anchor: SignedExternalComplianceAnchorV1;
  trusted_auditor_key: TrustedAuditorKeyV1;
  trusted_auditor_key_registry: TrustedAuditorKeyRegistryV1;
  anchor_registry_binding: SignedAnchorRegistryBindingV1;
  proof_hash: string;
};

export type EndToEndExternalTrustVerificationV1 = {
  schema: "goodle.end-to-end-external-trust-verification.v1";
  valid: boolean;
  checks: {
    audit_package: boolean;
    compliance_recomputed: boolean;
    compliance_receipt: boolean;
    compliance_registry: boolean;
    compliance_registry_link: boolean;
    signed_anchor: boolean;
    auditor_key_registry: boolean;
    historical_binding: boolean;
    identity_chain: boolean;
    proof_hash: boolean;
  };
  reasons: string[];
};

function sameJson(a: unknown, b: unknown): boolean {
  return sha256Json(a) === sha256Json(b);
}

function complianceRegistryContainsReceipt(input: {
  registry: ExternalTrustRegistryV1;
  receipt: ExternalComplianceReceiptV1;
}): boolean {
  return input.registry.entries.some(
    (entry) =>
      entry.package_id === input.receipt.package_id &&
      entry.audit_package_id === input.receipt.audit_package_id &&
      entry.compliance_receipt_id === input.receipt.receipt_id &&
      entry.compliance_receipt_hash === input.receipt.receipt_hash &&
      entry.decision === input.receipt.decision,
  );
}

function identityChainValid(input: {
  audit: DistributionAuditPackageV1;
  result: ExternalAuditComplianceResultV1;
  receipt: ExternalComplianceReceiptV1;
  anchor: SignedExternalComplianceAnchorV1;
  key: TrustedAuditorKeyV1;
  binding: SignedAnchorRegistryBindingV1;
}): boolean {
  return (
    input.result.audit_package_id === input.audit.audit_package_id &&
    input.result.package_id === input.audit.package_id &&
    input.receipt.audit_package_id === input.audit.audit_package_id &&
    input.receipt.package_id === input.audit.package_id &&
    input.receipt.decision === input.result.decision &&
    input.anchor.compliance_receipt_id === input.receipt.receipt_id &&
    input.anchor.compliance_receipt_hash === input.receipt.receipt_hash &&
    input.anchor.package_id === input.audit.package_id &&
    input.anchor.audit_package_id === input.audit.audit_package_id &&
    input.anchor.decision === input.result.decision &&
    input.anchor.key_id === input.key.key_id &&
    input.anchor.auditor_id === input.key.auditor_id &&
    input.binding.anchor_id === input.anchor.anchor_id &&
    input.binding.anchor_hash === input.anchor.anchor_hash &&
    input.binding.compliance_receipt_id === input.receipt.receipt_id &&
    input.binding.package_id === input.audit.package_id &&
    input.binding.key_id === input.key.key_id &&
    input.binding.auditor_id === input.key.auditor_id
  );
}

export function createEndToEndExternalTrustProof(input: {
  audit_package: DistributionAuditPackageV1;
  compliance_policy: ExternalAuditCompliancePolicyV1;
  compliance_result: ExternalAuditComplianceResultV1;
  compliance_receipt: ExternalComplianceReceiptV1;
  external_trust_registry: ExternalTrustRegistryV1;
  signed_anchor: SignedExternalComplianceAnchorV1;
  trusted_auditor_key: TrustedAuditorKeyV1;
  trusted_auditor_key_registry: TrustedAuditorKeyRegistryV1;
  anchor_registry_binding: SignedAnchorRegistryBindingV1;
}): EndToEndExternalTrustProofV1 {
  const verification = verifyEndToEndExternalTrustComponents(input);
  if (!verification.valid) {
    throw new Error(
      `END_TO_END_EXTERNAL_TRUST_COMPONENTS_INVALID: ${verification.reasons.join(",")}`,
    );
  }

  const unsigned = {
    schema: "goodle.end-to-end-external-trust-proof.v1" as const,
    package_id: input.audit_package.package_id,
    package_hash: input.audit_package.package_hash,
    audit_package: input.audit_package,
    compliance_policy: input.compliance_policy,
    compliance_result: input.compliance_result,
    compliance_receipt: input.compliance_receipt,
    external_trust_registry: input.external_trust_registry,
    signed_anchor: input.signed_anchor,
    trusted_auditor_key: input.trusted_auditor_key,
    trusted_auditor_key_registry: input.trusted_auditor_key_registry,
    anchor_registry_binding: input.anchor_registry_binding,
  };

  const proof_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    proof_id: `external-trust-proof-${proof_hash.slice(0, 16)}`,
    proof_hash,
  };
}

function verifyEndToEndExternalTrustComponents(input: {
  audit_package: DistributionAuditPackageV1;
  compliance_policy: ExternalAuditCompliancePolicyV1;
  compliance_result: ExternalAuditComplianceResultV1;
  compliance_receipt: ExternalComplianceReceiptV1;
  external_trust_registry: ExternalTrustRegistryV1;
  signed_anchor: SignedExternalComplianceAnchorV1;
  trusted_auditor_key: TrustedAuditorKeyV1;
  trusted_auditor_key_registry: TrustedAuditorKeyRegistryV1;
  anchor_registry_binding: SignedAnchorRegistryBindingV1;
}): EndToEndExternalTrustVerificationV1 {
  const reasons: string[] = [];

  const audit_package =
    verifyDistributionAuditPackage(input.audit_package).valid;

  const recomputed = evaluateExternalAuditCompliance({
    audit: input.audit_package,
    policy: input.compliance_policy,
  });
  const compliance_recomputed = sameJson(
    recomputed,
    input.compliance_result,
  );

  const compliance_receipt =
    verifyExternalComplianceReceipt(input.compliance_receipt);

  const compliance_registry =
    verifyExternalTrustRegistry(input.external_trust_registry);

  const compliance_registry_link =
    compliance_registry &&
    complianceRegistryContainsReceipt({
      registry: input.external_trust_registry,
      receipt: input.compliance_receipt,
    });

  const signed_anchor = verifySignedExternalComplianceAnchor({
    anchor: input.signed_anchor,
    receipt: input.compliance_receipt,
    trusted_key: input.trusted_auditor_key,
  });

  const auditor_key_registry = verifyTrustedAuditorKeyRegistry(
    input.trusted_auditor_key_registry,
  );

  const bindingVerification = verifySignedAnchorRegistryBinding({
    binding: input.anchor_registry_binding,
    anchor: input.signed_anchor,
    receipt: input.compliance_receipt,
    trusted_key: input.trusted_auditor_key,
    key_registry: input.trusted_auditor_key_registry,
  });
  const historical_binding = bindingVerification.valid;

  const identity_chain = identityChainValid({
    audit: input.audit_package,
    result: input.compliance_result,
    receipt: input.compliance_receipt,
    anchor: input.signed_anchor,
    key: input.trusted_auditor_key,
    binding: input.anchor_registry_binding,
  });

  if (!audit_package) reasons.push("AUDIT_PACKAGE_INVALID");
  if (!compliance_recomputed) reasons.push("COMPLIANCE_RESULT_RECOMPUTE_MISMATCH");
  if (!compliance_receipt) reasons.push("COMPLIANCE_RECEIPT_INVALID");
  if (!compliance_registry) reasons.push("EXTERNAL_TRUST_REGISTRY_INVALID");
  if (!compliance_registry_link) reasons.push("COMPLIANCE_RECEIPT_NOT_IN_REGISTRY");
  if (!signed_anchor) reasons.push("SIGNED_ANCHOR_INVALID");
  if (!auditor_key_registry) reasons.push("AUDITOR_KEY_REGISTRY_INVALID");
  if (!historical_binding) reasons.push("HISTORICAL_KEY_BINDING_INVALID");
  if (!identity_chain) reasons.push("END_TO_END_IDENTITY_CHAIN_INVALID");

  return {
    schema: "goodle.end-to-end-external-trust-verification.v1",
    valid:
      audit_package &&
      compliance_recomputed &&
      compliance_receipt &&
      compliance_registry &&
      compliance_registry_link &&
      signed_anchor &&
      auditor_key_registry &&
      historical_binding &&
      identity_chain,
    checks: {
      audit_package,
      compliance_recomputed,
      compliance_receipt,
      compliance_registry,
      compliance_registry_link,
      signed_anchor,
      auditor_key_registry,
      historical_binding,
      identity_chain,
      proof_hash: true,
    },
    reasons,
  };
}

export function verifyEndToEndExternalTrustProof(
  proof: EndToEndExternalTrustProofV1,
): EndToEndExternalTrustVerificationV1 {
  const componentVerification = verifyEndToEndExternalTrustComponents({
    audit_package: proof.audit_package,
    compliance_policy: proof.compliance_policy,
    compliance_result: proof.compliance_result,
    compliance_receipt: proof.compliance_receipt,
    external_trust_registry: proof.external_trust_registry,
    signed_anchor: proof.signed_anchor,
    trusted_auditor_key: proof.trusted_auditor_key,
    trusted_auditor_key_registry: proof.trusted_auditor_key_registry,
    anchor_registry_binding: proof.anchor_registry_binding,
  });

  const {
    proof_id: _proofId,
    proof_hash,
    ...unsigned
  } = proof;

  const proof_hash_valid =
    proof.package_id === proof.audit_package.package_id &&
    proof.package_hash === proof.audit_package.package_hash &&
    sha256Json(unsigned) === proof_hash;

  const reasons = [...componentVerification.reasons];
  if (!proof_hash_valid) reasons.push("END_TO_END_PROOF_HASH_INVALID");

  return {
    ...componentVerification,
    valid: componentVerification.valid && proof_hash_valid,
    checks: {
      ...componentVerification.checks,
      proof_hash: proof_hash_valid,
    },
    reasons,
  };
}
