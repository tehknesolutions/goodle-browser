import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { PublicationReceiptV1 } from "./PublicationRegistry";
import type { PublicationRevocationReceiptV1 } from "./PublicationRevocationRegistry";
import type { PublicationReinstatementReceiptV1 } from "./PublicationReinstatement";
import {
  appendPublicationLifecycleEvent,
  createPublicationLifecycleLedger,
  deriveCurrentPublicationLifecycleState,
  verifyPublicationLifecycleLedger,
} from "./PublicationLifecycleLedger";

function publication(): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-50",
    package_hash: "pkg-hash-50",
    target: "MARKETPLACE" as const,
    action: "MARKETPLACE_LISTED" as const,
    registry_ref: "marketplace://goodle/pkg-50",
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "publication-50",
    receipt_hash: sha256Json(unsigned),
  };
}

function revocation(publicationReceipt: PublicationReceiptV1): PublicationRevocationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-revocation-receipt.v1" as const,
    publication_receipt_id: publicationReceipt.receipt_id,
    publication_receipt_hash: publicationReceipt.receipt_hash,
    package_id: publicationReceipt.package_id,
    package_hash: publicationReceipt.package_hash,
    target: publicationReceipt.target,
    action: "DELISTED" as const,
    registry_ref: publicationReceipt.registry_ref,
    reason_code: "OWNER_REQUEST",
    status: "REVOKED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "revocation-50",
    receipt_hash: sha256Json(unsigned),
  };
}

function reinstatement(
  publicationReceipt: PublicationReceiptV1,
  revocationReceipt: PublicationRevocationReceiptV1,
): PublicationReinstatementReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-reinstatement-receipt.v1" as const,
    publication_receipt_id: publicationReceipt.receipt_id,
    publication_receipt_hash: publicationReceipt.receipt_hash,
    revocation_receipt_id: revocationReceipt.receipt_id,
    revocation_receipt_hash: revocationReceipt.receipt_hash,
    package_id: publicationReceipt.package_id,
    package_hash: publicationReceipt.package_hash,
    target: publicationReceipt.target,
    action: "RELISTED" as const,
    registry_ref: publicationReceipt.registry_ref,
    reason_code: "OWNER_RESTORED",
    status: "REINSTATED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "reinstatement-50",
    receipt_hash: sha256Json(unsigned),
  };
}

describe("M50 Unified Publication Lifecycle Ledger", () => {
  it("derives state from the full append-only sequence", () => {
    const p = publication();
    const r = revocation(p);
    const i = reinstatement(p, r);

    let ledger = createPublicationLifecycleLedger();
    expect(deriveCurrentPublicationLifecycleState(ledger)).toBe("UNPUBLISHED");

    ledger = appendPublicationLifecycleEvent(ledger, {
      kind: "PUBLICATION",
      receipt: p,
    });
    expect(deriveCurrentPublicationLifecycleState(ledger)).toBe("ACTIVE");

    ledger = appendPublicationLifecycleEvent(ledger, {
      kind: "REVOCATION",
      receipt: r,
    });
    expect(deriveCurrentPublicationLifecycleState(ledger)).toBe("REVOKED");

    ledger = appendPublicationLifecycleEvent(ledger, {
      kind: "REINSTATEMENT",
      receipt: i,
    });

    expect(deriveCurrentPublicationLifecycleState(ledger)).toBe("ACTIVE");
    expect(ledger.entries.map((entry) => entry.event_kind)).toEqual([
      "PUBLICATION",
      "REVOCATION",
      "REINSTATEMENT",
    ]);
    expect(verifyPublicationLifecycleLedger(ledger)).toBe(true);
  });

  it("refuses revocation before publication", () => {
    const p = publication();
    const r = revocation(p);

    expect(() =>
      appendPublicationLifecycleEvent(createPublicationLifecycleLedger(), {
        kind: "REVOCATION",
        receipt: r,
      }),
    ).toThrow("PUBLICATION_LIFECYCLE_MUST_START_WITH_PUBLICATION");
  });

  it("refuses two revocations in a row", () => {
    const p = publication();
    const r = revocation(p);

    let ledger = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt: p },
    );
    ledger = appendPublicationLifecycleEvent(ledger, {
      kind: "REVOCATION",
      receipt: r,
    });

    const secondRevocation = {
      ...r,
      receipt_id: "revocation-50b",
    };
    const {
      receipt_hash: _oldHash,
      receipt_id: _oldId,
      ...unsigned
    } = secondRevocation;
    secondRevocation.receipt_hash = sha256Json(unsigned);

    expect(() =>
      appendPublicationLifecycleEvent(ledger, {
        kind: "REVOCATION",
        receipt: secondRevocation,
      }),
    ).toThrow("PUBLICATION_LIFECYCLE_REVOCATION_REQUIRES_ACTIVE");
  });

  it("rejects reinstatement linked to the wrong revocation", () => {
    const p = publication();
    const r = revocation(p);
    const i = reinstatement(p, r);

    let ledger = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt: p },
    );
    ledger = appendPublicationLifecycleEvent(ledger, {
      kind: "REVOCATION",
      receipt: r,
    });

    const tampered = {
      ...i,
      revocation_receipt_id: "other-revocation",
    };
    const {
      receipt_hash: _hash,
      receipt_id: _id,
      ...unsigned
    } = tampered;
    tampered.receipt_hash = sha256Json(unsigned);

    expect(() =>
      appendPublicationLifecycleEvent(ledger, {
        kind: "REINSTATEMENT",
        receipt: tampered,
      }),
    ).toThrow("PUBLICATION_LIFECYCLE_REINSTATEMENT_LINK_MISMATCH");
  });

  it("detects historical tampering", () => {
    const p = publication();

    const ledger = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt: p },
    );

    const tampered = {
      ...ledger,
      entries: ledger.entries.map((entry) => ({
        ...entry,
        package_hash: "tampered",
      })),
    };

    expect(verifyPublicationLifecycleLedger(tampered)).toBe(false);
  });
});
