import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { PublicationReceiptV1 } from "./PublicationRegistry";
import type { PublicationRevocationReceiptV1 } from "./PublicationRevocationRegistry";
import {
  appendPublicationLifecycleEvent,
  createPublicationLifecycleLedger,
} from "./PublicationLifecycleLedger";
import { createUnifiedDistributionRegistry } from "./UnifiedDistributionRegistry";
import {
  assertDistributionAvailable,
  evaluateDistributionAvailability,
} from "./DistributionAvailabilityGate";

function publication(
  target: "IMPORT" | "PUBLISH" | "MARKETPLACE" | "HNK_VERSE",
): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-52",
    package_hash: "pkg-hash-52",
    target,
    action:
      target === "IMPORT"
        ? "IMPORTED" as const
        : target === "PUBLISH"
          ? "PUBLISHED" as const
          : target === "MARKETPLACE"
            ? "MARKETPLACE_LISTED" as const
            : "HNK_VERSE_ADMITTED" as const,
    registry_ref: `${target.toLowerCase()}://goodle/pkg-52`,
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
    reason_code: "M52_TEST",
    status: "REVOKED" as const,
  };

  return {
    ...unsigned,
    receipt_id: `revocation-${publicationReceipt.target}`,
    receipt_hash: sha256Json(unsigned),
  };
}

function registry() {
  const marketplacePublication = publication("MARKETPLACE");
  const marketplace = appendPublicationLifecycleEvent(
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

  return createUnifiedDistributionRegistry({
    package_id: "pkg-52",
    package_hash: "pkg-hash-52",
    lifecycle_ledgers: [marketplace, hnk],
  });
}

describe("M52 Distribution Availability Gate", () => {
  it("allows marketplace discovery for ACTIVE publication", () => {
    const decision = evaluateDistributionAvailability({
      registry: registry(),
      target: "MARKETPLACE",
      capability: "DISCOVER",
    });

    expect(decision).toMatchObject({
      decision: "ALLOWED",
      available: true,
      state: "ACTIVE",
    });
    expect(() => assertDistributionAvailable(decision)).not.toThrow();
  });

  it("blocks HNK-VERSE execution when revoked", () => {
    const decision = evaluateDistributionAvailability({
      registry: registry(),
      target: "HNK_VERSE",
      capability: "EXECUTE",
    });

    expect(decision).toMatchObject({
      decision: "BLOCKED",
      available: false,
      state: "REVOKED",
      reason: "DISTRIBUTION_TARGET_REVOKED",
    });
  });

  it("blocks unpublished targets even for discovery", () => {
    const decision = evaluateDistributionAvailability({
      registry: registry(),
      target: "IMPORT",
      capability: "DISCOVER",
    });

    expect(decision).toMatchObject({
      decision: "BLOCKED",
      available: false,
      state: "UNPUBLISHED",
      reason: "DISTRIBUTION_TARGET_UNPUBLISHED",
    });
  });

  it("blocks execution on marketplace by default even when active", () => {
    const decision = evaluateDistributionAvailability({
      registry: registry(),
      target: "MARKETPLACE",
      capability: "EXECUTE",
    });

    expect(decision).toMatchObject({
      decision: "BLOCKED",
      available: false,
      state: "ACTIVE",
      reason: "DISTRIBUTION_CAPABILITY_NOT_ALLOWED",
    });
  });
});
