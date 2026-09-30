import type {
  DistributionAvailabilityDecisionV1,
  DistributionCapability,
} from "./DistributionAvailabilityGate";
import { assertDistributionAvailable } from "./DistributionAvailabilityGate";
import type { EvidencePackageAdmissionTarget } from "./EvidencePackageConsumer";
import { sha256Json } from "./BuildLedger";

export type DistributionAccessStatus =
  | "SUCCEEDED"
  | "FAILED";

export type DistributionAccessReceiptV1 = {
  schema: "goodle.distribution-access-receipt.v1";
  receipt_id: string;
  package_id: string;
  package_hash: string;
  target: EvidencePackageAdmissionTarget;
  capability: DistributionCapability;
  state_at_access: "ACTIVE";
  status: DistributionAccessStatus;
  result_ref?: string;
  error_code?: string;
  receipt_hash: string;
};

export type DistributionUsageChronicleEntryV1 = {
  schema: "goodle.distribution-usage-chronicle-entry.v1";
  entry_id: string;
  sequence: number;
  package_id: string;
  package_hash: string;
  target: EvidencePackageAdmissionTarget;
  capability: DistributionCapability;
  access_receipt_id: string;
  access_receipt_hash: string;
  status: DistributionAccessStatus;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type DistributionUsageChronicleV1 = {
  schema: "goodle.distribution-usage-chronicle.v1";
  entries: DistributionUsageChronicleEntryV1[];
  head_hash?: string;
  chronicle_hash: string;
};

function chronicleHash(
  entries: DistributionUsageChronicleEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.distribution-usage-chronicle.v1",
    entries,
    head_hash,
  });
}

export function createDistributionUsageChronicle(): DistributionUsageChronicleV1 {
  const entries: DistributionUsageChronicleEntryV1[] = [];
  return {
    schema: "goodle.distribution-usage-chronicle.v1",
    entries,
    head_hash: undefined,
    chronicle_hash: chronicleHash(entries, undefined),
  };
}

export function createDistributionAccessReceipt(input: {
  decision: DistributionAvailabilityDecisionV1;
  status: DistributionAccessStatus;
  result_ref?: string;
  error_code?: string;
}): DistributionAccessReceiptV1 {
  assertDistributionAvailable(input.decision);

  if (input.decision.state !== "ACTIVE") {
    throw new Error("DISTRIBUTION_ACCESS_REQUIRES_ACTIVE_STATE");
  }

  if (input.status === "SUCCEEDED" && !input.result_ref) {
    throw new Error("DISTRIBUTION_ACCESS_SUCCESS_RESULT_REQUIRED");
  }

  if (input.status === "FAILED" && !input.error_code) {
    throw new Error("DISTRIBUTION_ACCESS_FAILURE_CODE_REQUIRED");
  }

  const unsigned = {
    schema: "goodle.distribution-access-receipt.v1" as const,
    package_id: input.decision.package_id,
    package_hash: input.decision.package_hash,
    target: input.decision.target,
    capability: input.decision.capability,
    state_at_access: "ACTIVE" as const,
    status: input.status,
    result_ref:
      input.status === "SUCCEEDED" ? input.result_ref : undefined,
    error_code:
      input.status === "FAILED" ? input.error_code : undefined,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `distribution-access-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function verifyDistributionAccessReceipt(
  receipt: DistributionAccessReceiptV1,
): boolean {
  if (
    receipt.status === "SUCCEEDED" &&
    (!receipt.result_ref || receipt.error_code)
  ) {
    return false;
  }

  if (
    receipt.status === "FAILED" &&
    (!receipt.error_code || receipt.result_ref)
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

export function appendDistributionAccessReceipt(
  chronicle: DistributionUsageChronicleV1,
  receipt: DistributionAccessReceiptV1,
): DistributionUsageChronicleV1 {
  if (!verifyDistributionUsageChronicle(chronicle)) {
    throw new Error("DISTRIBUTION_USAGE_CHRONICLE_INTEGRITY_FAILED");
  }
  if (!verifyDistributionAccessReceipt(receipt)) {
    throw new Error("DISTRIBUTION_ACCESS_RECEIPT_INVALID");
  }
  if (
    chronicle.entries.some(
      (entry) => entry.access_receipt_id === receipt.receipt_id,
    )
  ) {
    throw new Error("DISTRIBUTION_ACCESS_ALREADY_RECORDED");
  }

  const unsigned = {
    schema: "goodle.distribution-usage-chronicle-entry.v1" as const,
    sequence: chronicle.entries.length + 1,
    package_id: receipt.package_id,
    package_hash: receipt.package_hash,
    target: receipt.target,
    capability: receipt.capability,
    access_receipt_id: receipt.receipt_id,
    access_receipt_hash: receipt.receipt_hash,
    status: receipt.status,
    previous_entry_hash: chronicle.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: DistributionUsageChronicleEntryV1 = {
    ...unsigned,
    entry_id: `distribution-usage-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
    entry_hash,
  };

  const entries = [...chronicle.entries, entry];

  return {
    schema: chronicle.schema,
    entries,
    head_hash: entry_hash,
    chronicle_hash: chronicleHash(entries, entry_hash),
  };
}

export function verifyDistributionUsageChronicle(
  chronicle: DistributionUsageChronicleV1,
): boolean {
  let previous: string | undefined;

  for (let index = 0; index < chronicle.entries.length; index += 1) {
    const entry = chronicle.entries[index];
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

  const expectedHead = chronicle.entries.at(-1)?.entry_hash;
  if (chronicle.head_hash !== expectedHead) return false;

  return (
    chronicle.chronicle_hash ===
    chronicleHash(chronicle.entries, chronicle.head_hash)
  );
}
