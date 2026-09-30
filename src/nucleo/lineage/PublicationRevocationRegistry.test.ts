import { describe, expect, it } from "vitest";
import type { PublicationReceiptV1 } from "./PublicationRegistry";
import {
  appendPublicationReceipt,
  createPublicationRegistry,
  verifyPublicationRegistry,
} from "./PublicationRegistry";
import { sha256Json } from "./BuildLedger";
import {
  createPublicationRevocationReceipt,
  derivePublicationState,
  verifyPublicationRevocationReceipt,
  verifyPublicationState,
} from "./PublicationRevocationRegistry";

function publication(target: "IMPORT" | "PUBLISH" | "MARKETPLACE" | "HNK_VERSE"): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-48",
    package_hash: "pkg-hash-48",
    target,
    action:
      target === "MARKETPLACE"
        ? "MARKETPLACE_LISTED" as const
        : target === "HNK_VERSE"
          ? "HNK_VERSE_ADMITTED" as const
          : target === "IMPORT"
            ? "IMPORTED" as const
            : "PUBLISHED" as const,
    registry_ref: `${target.toLowerCase()}://goodle/pkg-48`,
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "publication-48",
    receipt_hash: sha256Json(unsigned),
  };
}

describe("M48 Publication Revocation Registry", () => {
  it("delists a marketplace publication without erasing the original registry entry", () => {
    const receipt = publication("MARKETPLACE");
    const registry = appendPublicationReceipt(
      createPublicationRegistry(),
      receipt,
    );

    const revocation = createPublicationRevocationReceipt({
      publication_receipt: receipt,
      registry,
      reason_code: "OWNER_REQUEST",
    });

    const state = derivePublicationState({
      publication_receipt: receipt,
      revocation_receipt: revocation,
    });

    expect(revocation).toMatchObject({
      action: "DELISTED",
      status: "REVOKED",
      publication_receipt_id: receipt.receipt_id,
    });
    expect(state).toMatchObject({
      state: "REVOKED",
      active: false,
      registry_ref: receipt.registry_ref,
    });
    expect(registry.entries).toHaveLength(1);
    expect(verifyPublicationRegistry(registry)).toBe(true);
    expect(verifyPublicationRevocationReceipt(revocation)).toBe(true);
    expect(verifyPublicationState(state)).toBe(true);
  });

  it("revokes HNK-VERSE admission distinctly", () => {
    const receipt = publication("HNK_VERSE");
    const registry = appendPublicationReceipt(
      createPublicationRegistry(),
      receipt,
    );

    const revocation = createPublicationRevocationReceipt({
      publication_receipt: receipt,
      registry,
      reason_code: "GOVERNANCE_REVOKED",
    });

    expect(revocation.action).toBe("HNK_VERSE_REVOKED");
  });

  it("derives ACTIVE state when no revocation exists", () => {
    const receipt = publication("PUBLISH");
    const state = derivePublicationState({
      publication_receipt: receipt,
    });

    expect(state).toMatchObject({
      state: "ACTIVE",
      active: true,
    });
  });

  it("refuses revocation if the original publication is not in the registry", () => {
    const receipt = publication("IMPORT");

    expect(() =>
      createPublicationRevocationReceipt({
        publication_receipt: receipt,
        registry: createPublicationRegistry(),
        reason_code: "OWNER_REQUEST",
      }),
    ).toThrow("PUBLICATION_REVOCATION_ORIGINAL_NOT_IN_REGISTRY");
  });

  it("detects tampered revocation state", () => {
    const receipt = publication("MARKETPLACE");
    const registry = appendPublicationReceipt(
      createPublicationRegistry(),
      receipt,
    );
    const revocation = createPublicationRevocationReceipt({
      publication_receipt: receipt,
      registry,
      reason_code: "POLICY_CHANGE",
    });
    const state = derivePublicationState({
      publication_receipt: receipt,
      revocation_receipt: revocation,
    });

    expect(
      verifyPublicationState({
        ...state,
        active: true,
      }),
    ).toBe(false);
  });
});
