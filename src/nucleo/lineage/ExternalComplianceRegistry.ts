import type {
  ExternalAuditComplianceDecision,
  ExternalAuditComplianceResultV1,
} from "./ExternalAuditComplianceGate";
import { sha256Json } from "./BuildLedger";

export type ExternalComplianceReceiptV1 = {
  schema: "goodle.external-compliance-receipt.v1";
  receipt_id: string;
  audit_package_id: string;
  package_id: string;
  decision: ExternalAuditComplianceDecision;
  acceptable: boolean;
  review_required: boolean;
  reasons: string[];
  receipt_hash: string;
};

export type ExternalTrustRegistryEntryV1 = {
  schema: "goodle.external-trust-registry-entry.v1";
  entry_id: string;
  sequence: number;
  package_id: string;
  audit_package_id: string;
  compliance_receipt_id: string;
  compliance_receipt_hash: string;
  decision: ExternalAuditComplianceDecision;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type ExternalTrustRegistryV1 = {
  schema: "goodle.external-trust-registry.v1";
  entries: ExternalTrustRegistryEntryV1[];
  head_hash?: string;
  registry_hash: string;
};

function registryHash(
  entries: ExternalTrustRegistryEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.external-trust-registry.v1",
    entries,
    head_hash,
  });
}

export function createExternalComplianceReceipt(
  result: ExternalAuditComplianceResultV1,
): ExternalComplianceReceiptV1 {
  const unsigned = {
    schema: "goodle.external-compliance-receipt.v1" as const,
    audit_package_id: result.audit_package_id,
    package_id: result.package_id,
    decision: result.decision,
    acceptable: result.acceptable,
    review_required: result.review_required,
    reasons: [...result.reasons],
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `external-compliance-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function verifyExternalComplianceReceipt(
  receipt: ExternalComplianceReceiptV1,
): boolean {
  if (
    receipt.decision === "COMPLIANT" &&
    (!receipt.acceptable || receipt.review_required)
  ) {
    return false;
  }

  if (
    receipt.decision === "REVIEW_REQUIRED" &&
    (receipt.acceptable || !receipt.review_required)
  ) {
    return false;
  }

  if (
    receipt.decision === "NON_COMPLIANT" &&
    (receipt.acceptable || receipt.review_required)
  ) {
    return false;
  }

  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === receipt_hash;
}

export function createExternalTrustRegistry(): ExternalTrustRegistryV1 {
  const entries: ExternalTrustRegistryEntryV1[] = [];
  return {
    schema: "goodle.external-trust-registry.v1",
    entries,
    head_hash: undefined,
    registry_hash: registryHash(entries, undefined),
  };
}

export function appendExternalComplianceReceipt(
  registry: ExternalTrustRegistryV1,
  receipt: ExternalComplianceReceiptV1,
): ExternalTrustRegistryV1 {
  if (!verifyExternalTrustRegistry(registry)) {
    throw new Error("EXTERNAL_TRUST_REGISTRY_INTEGRITY_FAILED");
  }
  if (!verifyExternalComplianceReceipt(receipt)) {
    throw new Error("EXTERNAL_COMPLIANCE_RECEIPT_INVALID");
  }
  if (
    registry.entries.some(
      (entry) => entry.compliance_receipt_id === receipt.receipt_id,
    )
  ) {
    throw new Error("EXTERNAL_COMPLIANCE_RECEIPT_ALREADY_RECORDED");
  }

  const unsigned = {
    schema: "goodle.external-trust-registry-entry.v1" as const,
    sequence: registry.entries.length + 1,
    package_id: receipt.package_id,
    audit_package_id: receipt.audit_package_id,
    compliance_receipt_id: receipt.receipt_id,
    compliance_receipt_hash: receipt.receipt_hash,
    decision: receipt.decision,
    previous_entry_hash: registry.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: ExternalTrustRegistryEntryV1 = {
    ...unsigned,
    entry_id: `external-trust-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
    entry_hash,
  };

  const entries = [...registry.entries, entry];

  return {
    schema: registry.schema,
    entries,
    head_hash: entry_hash,
    registry_hash: registryHash(entries, entry_hash),
  };
}

export function verifyExternalTrustRegistry(
  registry: ExternalTrustRegistryV1,
): boolean {
  let previous: string | undefined;

  for (let index = 0; index < registry.entries.length; index += 1) {
    const entry = registry.entries[index];
    if (!entry) return false;
    if (entry.sequence !== index + 1) return false;
    if (entry.previous_entry_hash !== previous) return false;

    const {
      entry_id: _entryId,
      entry_hash,
      ...unsigned
    } = entry;

    if (sha256Json(unsigned) !== entry_hash) return false;
    previous = entry_hash;
  }

  const expectedHead = registry.entries.at(-1)?.entry_hash;
  if (registry.head_hash !== expectedHead) return false;

  return (
    registry.registry_hash ===
    registryHash(registry.entries, registry.head_hash)
  );
}

export function latestComplianceDecisionForPackage(
  registry: ExternalTrustRegistryV1,
  package_id: string,
): ExternalAuditComplianceDecision | "UNASSESSED" {
  if (!verifyExternalTrustRegistry(registry)) {
    throw new Error("EXTERNAL_TRUST_REGISTRY_INTEGRITY_FAILED");
  }

  const latest = [...registry.entries]
    .reverse()
    .find((entry) => entry.package_id === package_id);

  return latest?.decision ?? "UNASSESSED";
}
