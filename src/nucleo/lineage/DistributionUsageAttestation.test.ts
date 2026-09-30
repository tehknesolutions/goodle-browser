import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { PublicationReceiptV1 } from "./PublicationRegistry";
import {
  appendPublicationLifecycleEvent,
  createPublicationLifecycleLedger,
} from "./PublicationLifecycleLedger";
import { createUnifiedDistributionRegistry } from "./UnifiedDistributionRegistry";
import type { DistributionAvailabilityDecisionV1 } from "./DistributionAvailabilityGate";
import {
  appendDistributionAccessReceipt,
  createDistributionAccessReceipt,
  createDistributionUsageChronicle,
} from "./DistributionAccessChronicle";
import {
  createDistributionUsageAttestation,
  verifyDistributionUsageAttestation,
} from "./DistributionUsageAttestation";

function publication(
  target: "MARKETPLACE" | "HNK_VERSE",
): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-54",
    package_hash: "pkg-hash-54",
    target,
    action:
      target === "MARKETPLACE"
        ? "MARKETPLACE_LISTED" as const
        : "HNK_VERSE_ADMITTED" as const,
    registry_ref: `${target.toLowerCase()}://goodle/pkg-54`,
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: `publication-${target}`,
    receipt_hash: sha256Json(unsigned),
  };
}

function allowed(
  target: "MARKETPLACE" | "HNK_VERSE",
  capability: "DISCOVER" | "LOAD" | "EXECUTE",
): DistributionAvailabilityDecisionV1 {
  return {
    schema: "goodle.distribution-availability-decision.v1",
    package_id: "pkg-54",
    package_hash: "pkg-hash-54",
    target,
    state: "ACTIVE",
    capability,
    decision: "ALLOWED",
    available: true,
  };
}

function registry() {
  const marketplace = appendPublicationLifecycleEvent(
    createPublicationLifecycleLedger(),
    { kind: "PUBLICATION", receipt: publication("MARKETPLACE") },
  );
  const hnk = appendPublicationLifecycleEvent(
    createPublicationLifecycleLedger(),
    { kind: "PUBLICATION", receipt: publication("HNK_VERSE") },
  );

  return createUnifiedDistributionRegistry({
    package_id: "pkg-54",
    package_hash: "pkg-hash-54",
    lifecycle_ledgers: [marketplace, hnk],
  });
}

describe("M54 Distribution Usage Attestation", () => {
  it("summarizes usage metrics and binds them to registry + chronicle", () => {
    let chronicle = createDistributionUsageChronicle();

    chronicle = appendDistributionAccessReceipt(
      chronicle,
      createDistributionAccessReceipt({
        decision: allowed("MARKETPLACE", "DISCOVER"),
        status: "SUCCEEDED",
        result_ref: "discover://pkg-54",
      }),
    );

    chronicle = appendDistributionAccessReceipt(
      chronicle,
      createDistributionAccessReceipt({
        decision: allowed("MARKETPLACE", "LOAD"),
        status: "SUCCEEDED",
        result_ref: "load://pkg-54",
      }),
    );

    chronicle = appendDistributionAccessReceipt(
      chronicle,
      createDistributionAccessReceipt({
        decision: allowed("HNK_VERSE", "EXECUTE"),
        status: "FAILED",
        error_code: "RUNTIME_BOOT_FAILED",
      }),
    );

    const distribution = registry();
    const attestation = createDistributionUsageAttestation({
      registry: distribution,
      chronicle,
    });

    expect(attestation.metrics).toEqual({
      total_operations: 3,
      succeeded: 2,
      failed: 1,
      by_target: {
        IMPORT: 0,
        PUBLISH: 0,
        MARKETPLACE: 2,
        HNK_VERSE: 1,
      },
      by_capability: {
        DISCOVER: 1,
        LOAD: 1,
        EXECUTE: 1,
      },
    });

    expect(attestation.active_targets_at_attestation).toEqual([
      "MARKETPLACE",
      "HNK_VERSE",
    ]);
    expect(
      verifyDistributionUsageAttestation({
        attestation,
        registry: distribution,
        chronicle,
      }),
    ).toBe(true);
  });

  it("rejects usage chronicle entries from another package", () => {
    const receipt = createDistributionAccessReceipt({
      decision: {
        ...allowed("MARKETPLACE", "DISCOVER"),
        package_id: "pkg-other",
        package_hash: "pkg-other-hash",
      },
      status: "SUCCEEDED",
      result_ref: "discover://other",
    });

    const chronicle = appendDistributionAccessReceipt(
      createDistributionUsageChronicle(),
      receipt,
    );

    expect(() =>
      createDistributionUsageAttestation({
        registry: registry(),
        chronicle,
      }),
    ).toThrow("DISTRIBUTION_USAGE_ATTESTATION_PACKAGE_MISMATCH");
  });

  it("detects metric tampering", () => {
    const receipt = createDistributionAccessReceipt({
      decision: allowed("MARKETPLACE", "DISCOVER"),
      status: "SUCCEEDED",
      result_ref: "discover://pkg-54",
    });

    const chronicle = appendDistributionAccessReceipt(
      createDistributionUsageChronicle(),
      receipt,
    );
    const distribution = registry();
    const attestation = createDistributionUsageAttestation({
      registry: distribution,
      chronicle,
    });

    expect(
      verifyDistributionUsageAttestation({
        attestation: {
          ...attestation,
          metrics: {
            ...attestation.metrics,
            total_operations: 999,
          },
        },
        registry: distribution,
        chronicle,
      }),
    ).toBe(false);
  });

  it("detects registry drift after attestation", () => {
    const receipt = createDistributionAccessReceipt({
      decision: allowed("HNK_VERSE", "EXECUTE"),
      status: "SUCCEEDED",
      result_ref: "execute://pkg-54",
    });

    const chronicle = appendDistributionAccessReceipt(
      createDistributionUsageChronicle(),
      receipt,
    );
    const distribution = registry();
    const attestation = createDistributionUsageAttestation({
      registry: distribution,
      chronicle,
    });

    const drifted = {
      ...distribution,
      active_targets: ["MARKETPLACE"] as typeof distribution.active_targets,
    };

    expect(
      verifyDistributionUsageAttestation({
        attestation,
        registry: drifted,
        chronicle,
      }),
    ).toBe(false);
  });
});
