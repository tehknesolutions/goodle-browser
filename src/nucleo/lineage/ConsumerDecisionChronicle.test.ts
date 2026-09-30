import { describe, expect, it } from "vitest";
import type { TrustProofConsumerResultV1 } from "./TrustProofConsumerGate";
import {
  appendConsumerDecisionReceipt,
  createConsumerDecisionChronicle,
  createConsumerDecisionReceipt,
  latestConsumerDecisionForProof,
  verifyConsumerDecisionChronicle,
  verifyConsumerDecisionReceipt,
} from "./ConsumerDecisionChronicle";

function result(decision: "ACCEPT" | "REVIEW" | "REJECT"): TrustProofConsumerResultV1 {
  return {
    schema: "goodle.trust-proof-consumer-result.v1",
    proof_id: "proof-63",
    package_id: "pkg-63",
    decision,
    accepted: decision === "ACCEPT",
    review_required: decision === "REVIEW",
    rejected: decision === "REJECT",
    reasons: decision === "ACCEPT" ? [] : [decision],
    verification: {
      schema: "goodle.end-to-end-external-trust-verification.v1",
      valid: decision !== "REJECT",
      checks: {
        audit_package: true,
        compliance_recomputed: true,
        compliance_receipt: true,
        compliance_registry: true,
        compliance_registry_link: true,
        signed_anchor: true,
        auditor_key_registry: true,
        historical_binding: true,
        identity_chain: true,
        proof_hash: decision !== "REJECT",
      },
      reasons: [],
    },
  };
}

describe("M63 Consumer Decision Chronicle", () => {
  it("creates and verifies an ACCEPT receipt", () => {
    const receipt = createConsumerDecisionReceipt({
      consumer_id: "consumer-a",
      result: result("ACCEPT"),
    });

    expect(verifyConsumerDecisionReceipt(receipt)).toBe(true);
  });

  it("keeps append-only decisions for multiple consumers", () => {
    let chronicle = createConsumerDecisionChronicle();

    chronicle = appendConsumerDecisionReceipt({
      chronicle,
      receipt: createConsumerDecisionReceipt({
        consumer_id: "consumer-a",
        result: result("ACCEPT"),
      }),
    });

    chronicle = appendConsumerDecisionReceipt({
      chronicle,
      receipt: createConsumerDecisionReceipt({
        consumer_id: "consumer-b",
        result: result("REVIEW"),
      }),
    });

    expect(verifyConsumerDecisionChronicle(chronicle)).toBe(true);
    expect(
      latestConsumerDecisionForProof({
        chronicle,
        proof_id: "proof-63",
        consumer_id: "consumer-a",
      }),
    ).toBe("ACCEPT");
    expect(
      latestConsumerDecisionForProof({
        chronicle,
        proof_id: "proof-63",
        consumer_id: "consumer-b",
      }),
    ).toBe("REVIEW");
  });

  it("rejects duplicate receipts", () => {
    const receipt = createConsumerDecisionReceipt({
      consumer_id: "consumer-a",
      result: result("REJECT"),
    });
    const chronicle = appendConsumerDecisionReceipt({
      chronicle: createConsumerDecisionChronicle(),
      receipt,
    });

    expect(() =>
      appendConsumerDecisionReceipt({ chronicle, receipt }),
    ).toThrow("CONSUMER_DECISION_RECEIPT_ALREADY_RECORDED");
  });

  it("detects semantic receipt tampering", () => {
    const receipt = createConsumerDecisionReceipt({
      consumer_id: "consumer-a",
      result: result("ACCEPT"),
    });

    expect(
      verifyConsumerDecisionReceipt({
        ...receipt,
        review_required: true,
      }),
    ).toBe(false);
  });

  it("detects historical chronicle tampering", () => {
    const receipt = createConsumerDecisionReceipt({
      consumer_id: "consumer-a",
      result: result("ACCEPT"),
    });
    const chronicle = appendConsumerDecisionReceipt({
      chronicle: createConsumerDecisionChronicle(),
      receipt,
    });

    expect(
      verifyConsumerDecisionChronicle({
        ...chronicle,
        entries: chronicle.entries.map((entry) => ({
          ...entry,
          decision: "REJECT" as const,
        })),
      }),
    ).toBe(false);
  });
});
