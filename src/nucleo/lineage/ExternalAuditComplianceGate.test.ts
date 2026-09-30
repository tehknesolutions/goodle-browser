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
import { createDistributionAuditPackage } from "./DistributionAuditPackage";
import {
  assertExternalAuditCompliant,
  evaluateExternalAuditCompliance,
  STRICT_EXTERNAL_AUDIT_POLICY_V1,
} from "./ExternalAuditComplianceGate";

function publication(target: "HNK_VERSE"): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-56",
    package_hash: "pkg-hash-56",
    target,
    action: "HNK_VERSE_ADMITTED" as const,
    registry_ref: "hnk_verse://goodle/pkg-56",
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "publication-hnk-56",
    receipt_hash: sha256Json(unsigned),
  };
}

function allowedExecute(): DistributionAvailabilityDecisionV1 {
  return {
    schema: "goodle.distribution-availability-decision.v1",
    package_id: "pkg-56",
    package_hash: "pkg-hash-56",
    target: "HNK_VERSE",
    state: "ACTIVE",
    capability: "EXECUTE",
    decision: "ALLOWED",
    available: true,
  };
}

function auditWithExecution(status: "SUCCEEDED" | "FAILED") {
  const ledger = appendPublicationLifecycleEvent(
    createPublicationLifecycleLedger(),
    {
      kind: "PUBLICATION",
      receipt: publication("HNK_VERSE"),
    },
  );

  const registry = createUnifiedDistributionRegistry({
    package_id: "pkg-56",
    package_hash: "pkg-hash-56",
    lifecycle_ledgers: [ledger],
  });

  const receipt = createDistributionAccessReceipt({
    decision: allowedExecute(),
    status,
    result_ref: status === "SUCCEEDED" ? "execute://pkg-56" : undefined,
    error_code: status === "FAILED" ? "BOOT_FAILED" : undefined,
  });

  const chronicle = appendDistributionAccessReceipt(
    createDistributionUsageChronicle(),
    receipt,
  );

  const attestation = createDistributionUsageAttestation({
    registry,
    chronicle,
  });

  return createDistributionAuditPackage({
    lifecycle_ledgers: [ledger],
    distribution_registry: registry,
    usage_chronicle: chronicle,
    usage_attestation: attestation,
  });
}

describe("M56 External Audit Compliance Gate", () => {
  it("marks valid successful distribution audit as compliant", () => {
    const result = evaluateExternalAuditCompliance({
      audit: auditWithExecution("SUCCEEDED"),
      policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
    });

    expect(result).toMatchObject({
      decision: "COMPLIANT",
      acceptable: true,
      review_required: false,
      reasons: [],
    });

    expect(() => assertExternalAuditCompliant(result)).not.toThrow();
  });

  it("requires review when policy thresholds are not satisfied", () => {
    const result = evaluateExternalAuditCompliance({
      audit: auditWithExecution("FAILED"),
      policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
    });

    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(result.acceptable).toBe(false);
    expect(result.review_required).toBe(true);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "FAILED_OPERATION_LIMIT_EXCEEDED",
        "FAILURE_RATE_LIMIT_EXCEEDED",
        "SUCCESSFUL_EXECUTION_REQUIRED",
      ]),
    );
  });

  it("returns NON_COMPLIANT for an invalid audit package", () => {
    const audit = auditWithExecution("SUCCEEDED");

    const result = evaluateExternalAuditCompliance({
      audit: {
        ...audit,
        package_hash: "tampered",
      },
      policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
    });

    expect(result.decision).toBe("NON_COMPLIANT");
    expect(result.acceptable).toBe(false);
    expect(result.review_required).toBe(false);
    expect(result.reasons).toContain(
      "DISTRIBUTION_AUDIT_PACKAGE_IDENTITY_INVALID",
    );
  });

  it("can require specific active targets and capability usage", () => {
    const result = evaluateExternalAuditCompliance({
      audit: auditWithExecution("SUCCEEDED"),
      policy: {
        require_active_targets: ["HNK_VERSE", "MARKETPLACE"],
        require_capability_usage: ["EXECUTE", "DISCOVER"],
      },
    });

    expect(result.decision).toBe("REVIEW_REQUIRED");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "REQUIRED_ACTIVE_TARGET_MISSING:MARKETPLACE",
        "REQUIRED_CAPABILITY_USAGE_MISSING:DISCOVER",
      ]),
    );
  });
});
