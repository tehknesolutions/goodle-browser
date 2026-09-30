import type { PublicationReceiptV1 } from "./PublicationRegistry";
import { verifyPublicationReceipt } from "./PublicationRegistry";
import type { PublicationRevocationReceiptV1 } from "./PublicationRevocationRegistry";
import { verifyPublicationRevocationReceipt } from "./PublicationRevocationRegistry";
import type { PublicationReinstatementReceiptV1 } from "./PublicationReinstatement";
import { verifyPublicationReinstatementReceipt } from "./PublicationReinstatement";
import { sha256Json } from "./BuildLedger";

export type PublicationLifecycleLedgerEvent =
  | {
      kind: "PUBLICATION";
      receipt: PublicationReceiptV1;
    }
  | {
      kind: "REVOCATION";
      receipt: PublicationRevocationReceiptV1;
    }
  | {
      kind: "REINSTATEMENT";
      receipt: PublicationReinstatementReceiptV1;
    };

export type PublicationLifecycleLedgerEntryV1 = {
  schema: "goodle.publication-lifecycle-ledger-entry.v1";
  entry_id: string;
  sequence: number;
  package_id: string;
  package_hash: string;
  target: PublicationReceiptV1["target"];
  registry_ref: string;
  event_kind: PublicationLifecycleLedgerEvent["kind"];
  receipt_id: string;
  receipt_hash: string;
  state_after: "ACTIVE" | "REVOKED";
  previous_entry_hash?: string;
  entry_hash: string;
};

export type PublicationLifecycleLedgerV1 = {
  schema: "goodle.publication-lifecycle-ledger.v1";
  entries: PublicationLifecycleLedgerEntryV1[];
  head_hash?: string;
  current_state?: "ACTIVE" | "REVOKED";
  ledger_hash: string;
};

function ledgerHash(
  entries: PublicationLifecycleLedgerEntryV1[],
  head_hash?: string,
  current_state?: "ACTIVE" | "REVOKED",
): string {
  return sha256Json({
    schema: "goodle.publication-lifecycle-ledger.v1",
    entries,
    head_hash,
    current_state,
  });
}

export function createPublicationLifecycleLedger(): PublicationLifecycleLedgerV1 {
  const entries: PublicationLifecycleLedgerEntryV1[] = [];
  return {
    schema: "goodle.publication-lifecycle-ledger.v1",
    entries,
    head_hash: undefined,
    current_state: undefined,
    ledger_hash: ledgerHash(entries, undefined, undefined),
  };
}

function receiptIdentity(event: PublicationLifecycleLedgerEvent): {
  package_id: string;
  package_hash: string;
  target: PublicationReceiptV1["target"];
  registry_ref: string;
  receipt_id: string;
  receipt_hash: string;
} {
  return {
    package_id: event.receipt.package_id,
    package_hash: event.receipt.package_hash,
    target: event.receipt.target,
    registry_ref: event.receipt.registry_ref,
    receipt_id: event.receipt.receipt_id,
    receipt_hash: event.receipt.receipt_hash,
  };
}

function validateEventIntegrity(event: PublicationLifecycleLedgerEvent): void {
  if (event.kind === "PUBLICATION") {
    if (!verifyPublicationReceipt(event.receipt)) {
      throw new Error("PUBLICATION_LIFECYCLE_PUBLICATION_RECEIPT_INVALID");
    }
    return;
  }

  if (event.kind === "REVOCATION") {
    if (!verifyPublicationRevocationReceipt(event.receipt)) {
      throw new Error("PUBLICATION_LIFECYCLE_REVOCATION_RECEIPT_INVALID");
    }
    return;
  }

  if (!verifyPublicationReinstatementReceipt(event.receipt)) {
    throw new Error("PUBLICATION_LIFECYCLE_REINSTATEMENT_RECEIPT_INVALID");
  }
}

export function appendPublicationLifecycleEvent(
  ledger: PublicationLifecycleLedgerV1,
  event: PublicationLifecycleLedgerEvent,
): PublicationLifecycleLedgerV1 {
  if (!verifyPublicationLifecycleLedger(ledger)) {
    throw new Error("PUBLICATION_LIFECYCLE_LEDGER_INTEGRITY_FAILED");
  }

  validateEventIntegrity(event);

  const identity = receiptIdentity(event);
  const first = ledger.entries[0];

  if (!first && event.kind !== "PUBLICATION") {
    throw new Error("PUBLICATION_LIFECYCLE_MUST_START_WITH_PUBLICATION");
  }

  if (first) {
    if (
      first.package_id !== identity.package_id ||
      first.package_hash !== identity.package_hash ||
      first.target !== identity.target ||
      first.registry_ref !== identity.registry_ref
    ) {
      throw new Error("PUBLICATION_LIFECYCLE_IDENTITY_MISMATCH");
    }
  }

  if (ledger.entries.some((entry) => entry.receipt_id === identity.receipt_id)) {
    throw new Error("PUBLICATION_LIFECYCLE_DUPLICATE_RECEIPT");
  }

  const currentState = ledger.current_state;

  if (event.kind === "PUBLICATION" && ledger.entries.length > 0) {
    throw new Error("PUBLICATION_LIFECYCLE_DUPLICATE_PUBLICATION");
  }

  if (event.kind === "REVOCATION") {
    if (currentState !== "ACTIVE") {
      throw new Error("PUBLICATION_LIFECYCLE_REVOCATION_REQUIRES_ACTIVE");
    }

    const publication = ledger.entries.find(
      (entry) => entry.event_kind === "PUBLICATION",
    );
    if (
      !publication ||
      event.receipt.publication_receipt_id !== publication.receipt_id ||
      event.receipt.publication_receipt_hash !== publication.receipt_hash
    ) {
      throw new Error("PUBLICATION_LIFECYCLE_REVOCATION_LINK_MISMATCH");
    }
  }

  if (event.kind === "REINSTATEMENT") {
    if (currentState !== "REVOKED") {
      throw new Error("PUBLICATION_LIFECYCLE_REINSTATEMENT_REQUIRES_REVOKED");
    }

    const publication = ledger.entries.find(
      (entry) => entry.event_kind === "PUBLICATION",
    );
    const lastRevocation = [...ledger.entries]
      .reverse()
      .find((entry) => entry.event_kind === "REVOCATION");

    if (
      !publication ||
      !lastRevocation ||
      event.receipt.publication_receipt_id !== publication.receipt_id ||
      event.receipt.publication_receipt_hash !== publication.receipt_hash ||
      event.receipt.revocation_receipt_id !== lastRevocation.receipt_id ||
      event.receipt.revocation_receipt_hash !== lastRevocation.receipt_hash
    ) {
      throw new Error("PUBLICATION_LIFECYCLE_REINSTATEMENT_LINK_MISMATCH");
    }
  }

  const state_after =
    event.kind === "REVOCATION" ? "REVOKED" as const : "ACTIVE" as const;

  const unsigned = {
    schema: "goodle.publication-lifecycle-ledger-entry.v1" as const,
    sequence: ledger.entries.length + 1,
    package_id: identity.package_id,
    package_hash: identity.package_hash,
    target: identity.target,
    registry_ref: identity.registry_ref,
    event_kind: event.kind,
    receipt_id: identity.receipt_id,
    receipt_hash: identity.receipt_hash,
    state_after,
    previous_entry_hash: ledger.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: PublicationLifecycleLedgerEntryV1 = {
    ...unsigned,
    entry_id: `publication-lifecycle-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
    entry_hash,
  };

  const entries = [...ledger.entries, entry];

  return {
    schema: ledger.schema,
    entries,
    head_hash: entry_hash,
    current_state: state_after,
    ledger_hash: ledgerHash(entries, entry_hash, state_after),
  };
}

export function verifyPublicationLifecycleLedger(
  ledger: PublicationLifecycleLedgerV1,
): boolean {
  let previous: string | undefined;
  let expectedState: "ACTIVE" | "REVOKED" | undefined;

  for (let index = 0; index < ledger.entries.length; index += 1) {
    const entry = ledger.entries[index];
    if (!entry) return false;
    if (entry.sequence !== index + 1) return false;
    if (entry.previous_entry_hash !== previous) return false;

    if (index === 0 && entry.event_kind !== "PUBLICATION") return false;

    if (entry.event_kind === "PUBLICATION") {
      if (index !== 0) return false;
      expectedState = "ACTIVE";
    } else if (entry.event_kind === "REVOCATION") {
      if (expectedState !== "ACTIVE") return false;
      expectedState = "REVOKED";
    } else {
      if (expectedState !== "REVOKED") return false;
      expectedState = "ACTIVE";
    }

    if (entry.state_after !== expectedState) return false;

    const {
      entry_id: _entryId,
      entry_hash,
      ...unsigned
    } = entry;

    if (sha256Json(unsigned) !== entry_hash) return false;
    previous = entry_hash;
  }

  const expectedHead = ledger.entries.at(-1)?.entry_hash;
  if (ledger.head_hash !== expectedHead) return false;
  if (ledger.current_state !== expectedState) return false;

  return (
    ledger.ledger_hash ===
    ledgerHash(ledger.entries, ledger.head_hash, ledger.current_state)
  );
}

export function deriveCurrentPublicationLifecycleState(
  ledger: PublicationLifecycleLedgerV1,
): "ACTIVE" | "REVOKED" | "UNPUBLISHED" {
  if (!verifyPublicationLifecycleLedger(ledger)) {
    throw new Error("PUBLICATION_LIFECYCLE_LEDGER_INTEGRITY_FAILED");
  }
  return ledger.current_state ?? "UNPUBLISHED";
}
