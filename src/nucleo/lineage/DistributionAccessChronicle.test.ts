import { describe, expect, it } from "vitest";
import type { DistributionAvailabilityDecisionV1 } from "./DistributionAvailabilityGate";
import {
  appendDistributionAccessReceipt,
  createDistributionAccessReceipt,
  createDistributionUsageChronicle,
  verifyDistributionAccessReceipt,
  verifyDistributionUsageChronicle,
} from "./DistributionAccessChronicle";

function allowed(
  capability: "DISCOVER" | "LOAD" | "EXECUTE" = "DISCOVER",
): DistributionAvailabilityDecisionV1 {
  return {
    schema: "goodle.distribution-availability-decision.v1",
    package_id: "pkg-53",
    package_hash: "pkg-hash-53",
    target: capability === "EXECUTE" ? "HNK_VERSE" : "MARKETPLACE",
    state: "ACTIVE",
    capability,
    decision: "ALLOWED",
    available: true,
  };
}

describe("M53 Distribution Access Receipt / Usage Chronicle", () => {
  it("records an actual successful use after availability was allowed", () => {
    const receipt = createDistributionAccessReceipt({
      decision: allowed("DISCOVER"),
      status: "SUCCEEDED",
      result_ref: "discover://marketplace/pkg-53",
    });

    expect(receipt).toMatchObject({
      capability: "DISCOVER",
      status: "SUCCEEDED",
      state_at_access: "ACTIVE",
    });
    expect(verifyDistributionAccessReceipt(receipt)).toBe(true);

    const chronicle = appendDistributionAccessReceipt(
      createDistributionUsageChronicle(),
      receipt,
    );

    expect(chronicle.entries).toHaveLength(1);
    expect(verifyDistributionUsageChronicle(chronicle)).toBe(true);
  });

  it("records a failed execute attempt that was authorized but failed at runtime", () => {
    const receipt = createDistributionAccessReceipt({
      decision: allowed("EXECUTE"),
      status: "FAILED",
      error_code: "RUNTIME_BOOT_FAILED",
    });

    expect(receipt).toMatchObject({
      target: "HNK_VERSE",
      capability: "EXECUTE",
      status: "FAILED",
      error_code: "RUNTIME_BOOT_FAILED",
    });
    expect(verifyDistributionAccessReceipt(receipt)).toBe(true);
  });

  it("refuses to create a usage receipt from a blocked decision", () => {
    const blocked: DistributionAvailabilityDecisionV1 = {
      ...allowed("LOAD"),
      decision: "BLOCKED",
      available: false,
      reason: "DISTRIBUTION_TARGET_REVOKED",
      state: "REVOKED",
    };

    expect(() =>
      createDistributionAccessReceipt({
        decision: blocked,
        status: "SUCCEEDED",
        result_ref: "load://marketplace/pkg-53",
      }),
    ).toThrow("DISTRIBUTION_NOT_AVAILABLE");
  });

  it("requires result ref for success and error code for failure", () => {
    expect(() =>
      createDistributionAccessReceipt({
        decision: allowed("LOAD"),
        status: "SUCCEEDED",
      }),
    ).toThrow("DISTRIBUTION_ACCESS_SUCCESS_RESULT_REQUIRED");

    expect(() =>
      createDistributionAccessReceipt({
        decision: allowed("LOAD"),
        status: "FAILED",
      }),
    ).toThrow("DISTRIBUTION_ACCESS_FAILURE_CODE_REQUIRED");
  });

  it("prevents duplicate receipt recording and detects historical tampering", () => {
    const receipt = createDistributionAccessReceipt({
      decision: allowed("LOAD"),
      status: "SUCCEEDED",
      result_ref: "load://marketplace/pkg-53",
    });

    const chronicle = appendDistributionAccessReceipt(
      createDistributionUsageChronicle(),
      receipt,
    );

    expect(() =>
      appendDistributionAccessReceipt(chronicle, receipt),
    ).toThrow("DISTRIBUTION_ACCESS_ALREADY_RECORDED");

    const tampered = {
      ...chronicle,
      entries: chronicle.entries.map((entry) => ({
        ...entry,
        status: "FAILED" as const,
      })),
    };

    expect(verifyDistributionUsageChronicle(tampered)).toBe(false);
  });
});
