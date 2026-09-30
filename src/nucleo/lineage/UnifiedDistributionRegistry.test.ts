import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { PublicationReceiptV1 } from "./PublicationRegistry";
import type { PublicationRevocationReceiptV1 } from "./PublicationRevocationRegistry";
import {
  appendPublicationLifecycleEvent,
  createPublicationLifecycleLedger,
} from "./PublicationLifecycleLedger";
import {
  createUnifiedDistributionRegistry,
  distributionStateFor,
  verifyUnifiedDistributionRegistry,
} from "./UnifiedDistributionRegistry";

function publication(
  target: "IMPORT" | "PUBLISH" | "MARKETPLACE" | "HNK_VERSE",
): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-51",
    package_hash: "pkg-hash-51",
    target,
    action:
      target === "IMPORT"
        ? "IMPORTED" as const
        : target === "PUBLISH"
          ? "PUBLISHED" as const
          : target === "MARKETPLACE"
            ? "MARKETPLACE_LISTED" as const
            : "HNK_VERSE_ADMITTED" as const,
    registry_ref: `${target.toLowerCase()}://goodle/pkg-51`,
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: `publication-${target}`,
    receipt_hash: sha256Json(unsigned),
  };
}

function revocation(
  publicationReceipt: PublicationReceiptV1,
): PublicationRevocationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-revocation-receipt.v1" as const,
    publication_receipt_id: publicationReceipt.receipt_id,
    publication_receipt_hash: publicationReceipt.receipt_hash,
    package_id: publicationReceipt.package_id,
    package_hash: publicationReceipt.package_hash,
    target: publicationReceipt.target,
    action:
      publicationReceipt.target === "MARKETPLACE"
        ? "DELISTED" as const
        : publicationReceipt.target === "HNK_VERSE"
          ? "HNK_VERSE_REVOKED" as const
          : "WITHDRAWN" as const,
    registry_ref: publicationReceipt.registry_ref,
    reason_code: "M51_TEST",
    status: "REVOKED" as const,
  };

  return {
    ...unsigned,
    receipt_id: `revocation-${publicationReceipt.target}`,
    receipt_hash: sha256Json(unsigned),
  };
}

describe("M51 Unified Distribution Registry", () => {
  it("derives a single package view across all external channels", () => {
    const marketplacePublication = publication("MARKETPLACE");
    let marketplace = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt: marketplacePublication },
    );

    const hnkPublication = publication("HNK_VERSE");
    let hnk = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt: hnkPublication },
    );
    hnk = appendPublicationLifecycleEvent(hnk, {
      kind: "REVOCATION",
      receipt: revocation(hnkPublication),
    });

    const registry = createUnifiedDistributionRegistry({
      package_id: "pkg-51",
      package_hash: "pkg-hash-51",
      lifecycle_ledgers: [marketplace, hnk],
    });

    expect(registry.active_targets).toEqual(["MARKETPLACE"]);
    expect(registry.revoked_targets).toEqual(["HNK_VERSE"]);
    expect(registry.unpublished_targets).toEqual(["IMPORT", "PUBLISH"]);
    expect(distributionStateFor(registry, "MARKETPLACE")).toBe("ACTIVE");
    expect(distributionStateFor(registry, "HNK_VERSE")).toBe("REVOKED");
    expect(distributionStateFor(registry, "IMPORT")).toBe("UNPUBLISHED");
    expect(verifyUnifiedDistributionRegistry(registry)).toBe(true);
  });

  it("rejects a lifecycle ledger from another package", () => {
    const receipt = publication("PUBLISH");
    const other = {
      ...receipt,
      package_id: "pkg-other",
    };
    const {
      receipt_hash: _oldHash,
      receipt_id: _oldId,
      ...unsigned
    } = other;
    other.receipt_hash = sha256Json(unsigned);

    const ledger = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt: other },
    );

    expect(() =>
      createUnifiedDistributionRegistry({
        package_id: "pkg-51",
        package_hash: "pkg-hash-51",
        lifecycle_ledgers: [ledger],
      }),
    ).toThrow("DISTRIBUTION_PACKAGE_IDENTITY_MISMATCH");
  });

  it("rejects duplicate lifecycle ledgers for the same target", () => {
    const receipt = publication("IMPORT");
    const one = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt },
    );

    const two = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt },
    );

    expect(() =>
      createUnifiedDistributionRegistry({
        package_id: "pkg-51",
        package_hash: "pkg-hash-51",
        lifecycle_ledgers: [one, two],
      }),
    ).toThrow("DISTRIBUTION_DUPLICATE_TARGET_LEDGER");
  });

  it("detects registry tampering", () => {
    const receipt = publication("MARKETPLACE");
    const ledger = appendPublicationLifecycleEvent(
      createPublicationLifecycleLedger(),
      { kind: "PUBLICATION", receipt },
    );

    const registry = createUnifiedDistributionRegistry({
      package_id: "pkg-51",
      package_hash: "pkg-hash-51",
      lifecycle_ledgers: [ledger],
    });

    expect(
      verifyUnifiedDistributionRegistry({
        ...registry,
        active_targets: [],
      }),
    ).toBe(false);
  });
});
