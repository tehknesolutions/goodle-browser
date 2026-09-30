import type {
  PublicationReceiptV1,
  PublicationRegistryV1,
  PublicationRegistryEntryV1,
} from "./PublicationRegistry";
import {
  verifyPublicationReceipt,
  verifyPublicationRegistry,
} from "./PublicationRegistry";
import { sha256Json } from "./BuildLedger";

export type PublicationRevocationAction =
  | "WITHDRAWN"
  | "DELISTED"
  | "HNK_VERSE_REVOKED";

export type PublicationRevocationReceiptV1 = {
  schema: "goodle.publication-revocation-receipt.v1";
  receipt_id: string;
  publication_receipt_id: string;
  publication_receipt_hash: string;
  package_id: string;
  package_hash: string;
  target: PublicationReceiptV1["target"];
  action: PublicationRevocationAction;
  registry_ref: string;
  reason_code: string;
  status: "REVOKED";
  receipt_hash: string;
};

export type PublicationStateV1 = {
  schema: "goodle.publication-state.v1";
  package_id: string;
  target: PublicationReceiptV1["target"];
  registry_ref: string;
  publication_receipt_id: string;
  publication_receipt_hash: string;
  active: boolean;
  revocation_receipt_id?: string;
  revocation_receipt_hash?: string;
  state: "ACTIVE" | "REVOKED";
  state_hash: string;
};

function actionForTarget(
  target: PublicationReceiptV1["target"],
): PublicationRevocationAction {
  switch (target) {
    case "MARKETPLACE":
      return "DELISTED";
    case "HNK_VERSE":
      return "HNK_VERSE_REVOKED";
    case "IMPORT":
    case "PUBLISH":
      return "WITHDRAWN";
  }
}

export function createPublicationRevocationReceipt(input: {
  publication_receipt: PublicationReceiptV1;
  registry: PublicationRegistryV1;
  reason_code: string;
}): PublicationRevocationReceiptV1 {
  if (!verifyPublicationReceipt(input.publication_receipt)) {
    throw new Error("PUBLICATION_REVOCATION_PUBLICATION_RECEIPT_INVALID");
  }
  if (!verifyPublicationRegistry(input.registry)) {
    throw new Error("PUBLICATION_REVOCATION_REGISTRY_INVALID");
  }
  if (!input.reason_code.trim()) {
    throw new Error("PUBLICATION_REVOCATION_REASON_REQUIRED");
  }

  const originalEntry = input.registry.entries.find(
    (entry) =>
      entry.receipt_id === input.publication_receipt.receipt_id &&
      entry.receipt_hash === input.publication_receipt.receipt_hash,
  );

  if (!originalEntry) {
    throw new Error("PUBLICATION_REVOCATION_ORIGINAL_NOT_IN_REGISTRY");
  }

  const unsigned = {
    schema: "goodle.publication-revocation-receipt.v1" as const,
    publication_receipt_id: input.publication_receipt.receipt_id,
    publication_receipt_hash: input.publication_receipt.receipt_hash,
    package_id: input.publication_receipt.package_id,
    package_hash: input.publication_receipt.package_hash,
    target: input.publication_receipt.target,
    action: actionForTarget(input.publication_receipt.target),
    registry_ref: input.publication_receipt.registry_ref,
    reason_code: input.reason_code,
    status: "REVOKED" as const,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `publication-revocation-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function verifyPublicationRevocationReceipt(
  receipt: PublicationRevocationReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;
  return sha256Json(unsigned) === receipt_hash;
}

export function derivePublicationState(input: {
  publication_receipt: PublicationReceiptV1;
  revocation_receipt?: PublicationRevocationReceiptV1;
}): PublicationStateV1 {
  if (!verifyPublicationReceipt(input.publication_receipt)) {
    throw new Error("PUBLICATION_STATE_PUBLICATION_RECEIPT_INVALID");
  }

  if (
    input.revocation_receipt &&
    !verifyPublicationRevocationReceipt(input.revocation_receipt)
  ) {
    throw new Error("PUBLICATION_STATE_REVOCATION_RECEIPT_INVALID");
  }

  if (
    input.revocation_receipt &&
    (
      input.revocation_receipt.publication_receipt_id !==
        input.publication_receipt.receipt_id ||
      input.revocation_receipt.publication_receipt_hash !==
        input.publication_receipt.receipt_hash ||
      input.revocation_receipt.package_id !== input.publication_receipt.package_id ||
      input.revocation_receipt.package_hash !== input.publication_receipt.package_hash ||
      input.revocation_receipt.target !== input.publication_receipt.target ||
      input.revocation_receipt.registry_ref !== input.publication_receipt.registry_ref
    )
  ) {
    throw new Error("PUBLICATION_STATE_REVOCATION_LINK_MISMATCH");
  }

  const revoked = Boolean(input.revocation_receipt);

  const unsigned = {
    schema: "goodle.publication-state.v1" as const,
    package_id: input.publication_receipt.package_id,
    target: input.publication_receipt.target,
    registry_ref: input.publication_receipt.registry_ref,
    publication_receipt_id: input.publication_receipt.receipt_id,
    publication_receipt_hash: input.publication_receipt.receipt_hash,
    active: !revoked,
    revocation_receipt_id: input.revocation_receipt?.receipt_id,
    revocation_receipt_hash: input.revocation_receipt?.receipt_hash,
    state: revoked ? "REVOKED" as const : "ACTIVE" as const,
  };

  return {
    ...unsigned,
    state_hash: sha256Json(unsigned),
  };
}

export function verifyPublicationState(
  state: PublicationStateV1,
): boolean {
  const { state_hash, ...unsigned } = state;
  return sha256Json(unsigned) === state_hash;
}
