import type {
  EvidencePackageAdmissionTarget,
  EvidencePackageConsumerResultV1,
} from "./EvidencePackageConsumer";
import { assertEvidencePackageAdmissible } from "./EvidencePackageConsumer";
import type { RuntimeEvidencePackageV1 } from "./RuntimeEvidencePackage";
import { sha256Json } from "./BuildLedger";

export type PublicationAction =
  | "IMPORTED"
  | "PUBLISHED"
  | "MARKETPLACE_LISTED"
  | "HNK_VERSE_ADMITTED";

export type PublicationReceiptV1 = {
  schema: "goodle.publication-receipt.v1";
  receipt_id: string;
  package_id: string;
  package_hash: string;
  target: EvidencePackageAdmissionTarget;
  action: PublicationAction;
  registry_ref: string;
  status: "COMPLETED";
  receipt_hash: string;
};

export type PublicationRegistryEntryV1 = {
  schema: "goodle.publication-registry-entry.v1";
  entry_id: string;
  sequence: number;
  package_id: string;
  package_hash: string;
  target: EvidencePackageAdmissionTarget;
  action: PublicationAction;
  receipt_id: string;
  receipt_hash: string;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type PublicationRegistryV1 = {
  schema: "goodle.publication-registry.v1";
  entries: PublicationRegistryEntryV1[];
  head_hash?: string;
  registry_hash: string;
};

function registryHash(
  entries: PublicationRegistryEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.publication-registry.v1",
    entries,
    head_hash,
  });
}

function actionForTarget(
  target: EvidencePackageAdmissionTarget,
): PublicationAction {
  switch (target) {
    case "IMPORT":
      return "IMPORTED";
    case "PUBLISH":
      return "PUBLISHED";
    case "MARKETPLACE":
      return "MARKETPLACE_LISTED";
    case "HNK_VERSE":
      return "HNK_VERSE_ADMITTED";
  }
}

export function createPublicationRegistry(): PublicationRegistryV1 {
  const entries: PublicationRegistryEntryV1[] = [];
  return {
    schema: "goodle.publication-registry.v1",
    entries,
    head_hash: undefined,
    registry_hash: registryHash(entries, undefined),
  };
}

export function createPublicationReceipt(input: {
  package: RuntimeEvidencePackageV1;
  admission: EvidencePackageConsumerResultV1;
  registry_ref: string;
}): PublicationReceiptV1 {
  assertEvidencePackageAdmissible(input.admission);

  if (input.admission.package_id !== input.package.package_id) {
    throw new Error("PUBLICATION_PACKAGE_ADMISSION_MISMATCH");
  }
  if (!input.registry_ref.trim()) {
    throw new Error("PUBLICATION_REGISTRY_REF_REQUIRED");
  }

  const action = actionForTarget(input.admission.target);

  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: input.package.package_id,
    package_hash: input.package.package_hash,
    target: input.admission.target,
    action,
    registry_ref: input.registry_ref,
    status: "COMPLETED" as const,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `publication-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function verifyPublicationReceipt(
  receipt: PublicationReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;
  return sha256Json(unsigned) === receipt_hash;
}

export function appendPublicationReceipt(
  registry: PublicationRegistryV1,
  receipt: PublicationReceiptV1,
): PublicationRegistryV1 {
  if (!verifyPublicationRegistry(registry)) {
    throw new Error("PUBLICATION_REGISTRY_INTEGRITY_FAILED");
  }
  if (!verifyPublicationReceipt(receipt)) {
    throw new Error("PUBLICATION_RECEIPT_INVALID");
  }

  const duplicate = registry.entries.some(
    (entry) =>
      entry.receipt_id === receipt.receipt_id ||
      (
        entry.package_id === receipt.package_id &&
        entry.target === receipt.target &&
        entry.action === receipt.action
      ),
  );
  if (duplicate) {
    throw new Error("PUBLICATION_ALREADY_RECORDED");
  }

  const unsigned = {
    schema: "goodle.publication-registry-entry.v1" as const,
    sequence: registry.entries.length + 1,
    package_id: receipt.package_id,
    package_hash: receipt.package_hash,
    target: receipt.target,
    action: receipt.action,
    receipt_id: receipt.receipt_id,
    receipt_hash: receipt.receipt_hash,
    previous_entry_hash: registry.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: PublicationRegistryEntryV1 = {
    ...unsigned,
    entry_id: `publication-entry-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
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

export function verifyPublicationRegistry(
  registry: PublicationRegistryV1,
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
