import { describe, expect, it } from "vitest";
import type { ExternalAuditComplianceResultV1 } from "./ExternalAuditComplianceGate";
import {
  appendExternalComplianceReceipt,
  createExternalComplianceReceipt,
  createExternalTrustRegistry,
  latestComplianceDecisionForPackage,
  verifyExternalComplianceReceipt,
  verifyExternalTrustRegistry,
} from "./ExternalComplianceRegistry";

function result(
  decision: "COMPLIANT" | "REVIEW_REQUIRED" | "NON_COMPLIANT",
  auditId = "audit-57",
): ExternalAuditComplianceResultV1 {
  return {
    schema: "goodle.external-audit-compliance-result.v1",
    audit_package_id: auditId,
    package_id: "pkg-57",
    decision,
    acceptable: decision === "COMPLIANT",
    review_required: decision === "REVIEW_REQUIRED",
    reasons:
      decision === "COMPLIANT"
        ? []
        : decision === "REVIEW_REQUIRED"
          ? ["SUCCESSFUL_EXECUTION_REQUIRED"]
          : ["DISTRIBUTION_AUDIT_PACKAGE_HASH_INVALID"],
    verification: {
      schema: "goodle.distribution-audit-package-verification.v1",
      valid: decision !== "NON_COMPLIANT",
      checks: {
        lifecycle_ledgers: true,
        distribution_registry: true,
        usage_chronicle: true,
        usage_attestation: true,
        lifecycle_registry_links: true,
        package_identity: true,
        audit_package_hash: decision !== "NON_COMPLIANT",
      },
      reasons:
        decision === "NON_COMPLIANT"
          ? ["DISTRIBUTION_AUDIT_PACKAGE_HASH_INVALID"]
          : [],
    },
  };
}

describe("M57 Compliance Receipt / External Trust Registry", () => {
  it("records a compliant decision as a hash-verifiable receipt", () => {
    const receipt = createExternalComplianceReceipt(result("COMPLIANT"));

    expect(receipt).toMatchObject({
      decision: "COMPLIANT",
      acceptable: true,
      review_required: false,
    });
    expect(verifyExternalComplianceReceipt(receipt)).toBe(true);
  });

  it("keeps append-only compliance history for the same package", () => {
    let registry = createExternalTrustRegistry();

    registry = appendExternalComplianceReceipt(
      registry,
      createExternalComplianceReceipt(
        result("REVIEW_REQUIRED", "audit-57a"),
      ),
    );

    registry = appendExternalComplianceReceipt(
      registry,
      createExternalComplianceReceipt(
        result("COMPLIANT", "audit-57b"),
      ),
    );

    expect(registry.entries.map((entry) => entry.decision)).toEqual([
      "REVIEW_REQUIRED",
      "COMPLIANT",
    ]);
    expect(latestComplianceDecisionForPackage(registry, "pkg-57")).toBe(
      "COMPLIANT",
    );
    expect(verifyExternalTrustRegistry(registry)).toBe(true);
  });

  it("rejects duplicate compliance receipt recording", () => {
    const receipt = createExternalComplianceReceipt(
      result("REVIEW_REQUIRED"),
    );
    const registry = appendExternalComplianceReceipt(
      createExternalTrustRegistry(),
      receipt,
    );

    expect(() =>
      appendExternalComplianceReceipt(registry, receipt),
    ).toThrow("EXTERNAL_COMPLIANCE_RECEIPT_ALREADY_RECORDED");
  });

  it("detects receipt semantic tampering", () => {
    const receipt = createExternalComplianceReceipt(result("COMPLIANT"));

    expect(
      verifyExternalComplianceReceipt({
        ...receipt,
        review_required: true,
      }),
    ).toBe(false);
  });

  it("detects historical registry tampering", () => {
    const receipt = createExternalComplianceReceipt(
      result("NON_COMPLIANT"),
    );
    const registry = appendExternalComplianceReceipt(
      createExternalTrustRegistry(),
      receipt,
    );

    const tampered = {
      ...registry,
      entries: registry.entries.map((entry) => ({
        ...entry,
        decision: "COMPLIANT" as const,
      })),
    };

    expect(verifyExternalTrustRegistry(tampered)).toBe(false);
  });
});
