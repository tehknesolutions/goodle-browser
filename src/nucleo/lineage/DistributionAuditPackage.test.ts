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
import { createDistributionUsageAttestation } from "./DistributionUsageAttestation";
import {
  createDistributionAuditPackage,
  verifyDistributionAuditPackage,
} from "./DistributionAuditPackage";

function publication(
  target: "MARKETPLACE" | "HNK_VERSE",
): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-55",
    package_hash: "pkg-hash-55",
    target,
    action:
      target === "MARKETPLACE"
        ? "MARKETPLACE_LISTED" as const
        : "HNK_VERSE_ADMITTED" as const,
    registry_ref: `${target.toLowerCase()}://goodle/pkg-55`,
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
    package_id: "pkg-55",
    package_hash: "pkg-hash-55",
    target,
    state: "ACTIVE",
    capability,
    decision: "ALLOWED",
    available: true,
  };
}

function fixture() {
  const marketplace = appendPublicationLifecycleEvent(
    createPublicationLifecycleLedger(),
    { kind: "PUBLICATION", receipt: publication("MARKETPLACE") },
  );
  const hnk = appendPublicationLifecycleEvent(
    createPublicationLifecycleLedger(),
    { kind: "PUBLICATION", receipt: publication("HNK_VERSE") },
  );

  const registry = createUnifiedDistributionRegistry({
    package_id: "pkg-55",
    package_hash: "pkg-hash-55",
    lifecycle_ledgers: [marketplace, hnk],
  });

  let chronicle = createDistributionUsageChronicle();
  chronicle = appendDistributionAccessReceipt(
    chronicle,
    createDistributionAccessReceipt({
      decision: allowed("MARKETPLACE", "DISCOVER"),
      status: "SUCCEEDED",
      result_ref: "discover://pkg-55",
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

  const attestation = createDistributionUsageAttestation({
    registry,
    chronicle,
  });

  return {
    ledgers: [marketplace, hnk],
    registry,
    chronicle,
    attestation,
  };
}

describe("M55 Distribution Audit Package", () => {
  it("packages lifecycle, state, usage and attestation into one audit proof", () => {
    const data = fixture();

    const audit = createDistributionAuditPackage({
      lifecycle_ledgers: data.ledgers,
      distribution_registry: data.registry,
      usage_chronicle: data.chronicle,
      usage_attestation: data.attestation,
    });

    expect(audit).toMatchObject({
      schema: "goodle.distribution-audit-package.v1",
      package_id: "pkg-55",
      package_hash: "pkg-hash-55",
    });

    expect(verifyDistributionAuditPackage(audit)).toMatchObject({
      valid: true,
      reasons: [],
    });
  });

  it("detects lifecycle ledger replacement", () => {
    const data = fixture();
    const audit = createDistributionAuditPackage({
      lifecycle_ledgers: data.ledgers,
      distribution_registry: data.registry,
      usage_chronicle: data.chronicle,
      usage_attestation: data.attestation,
    });

    const tamperedLedger = {
      ...audit.lifecycle_ledgers[0]!,
      ledger_hash: "tampered",
    };

    const verification = verifyDistributionAuditPackage({
      ...audit,
      lifecycle_ledgers: [tamperedLedger, ...audit.lifecycle_ledgers.slice(1)],
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("LIFECYCLE_LEDGER_INVALID");
  });

  it("detects usage chronicle drift after attestation", () => {
    const data = fixture();
    const audit = createDistributionAuditPackage({
      lifecycle_ledgers: data.ledgers,
      distribution_registry: data.registry,
      usage_chronicle: data.chronicle,
      usage_attestation: data.attestation,
    });

    const driftedChronicle = {
      ...audit.usage_chronicle,
      chronicle_hash: "drifted",
    };

    const verification = verifyDistributionAuditPackage({
      ...audit,
      usage_chronicle: driftedChronicle,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("USAGE_CHRONICLE_INVALID");
  });

  it("detects top-level package tampering", () => {
    const data = fixture();
    const audit = createDistributionAuditPackage({
      lifecycle_ledgers: data.ledgers,
      distribution_registry: data.registry,
      usage_chronicle: data.chronicle,
      usage_attestation: data.attestation,
    });

    const verification = verifyDistributionAuditPackage({
      ...audit,
      package_id: "pkg-tampered",
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain(
      "DISTRIBUTION_AUDIT_PACKAGE_IDENTITY_INVALID",
    );
    expect(verification.reasons).toContain(
      "DISTRIBUTION_AUDIT_PACKAGE_HASH_INVALID",
    );
  });
});
