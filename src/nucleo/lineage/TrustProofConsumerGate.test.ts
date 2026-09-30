import { generateKeyPairSync } from "node:crypto";
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
  evaluateExternalAuditCompliance,
  STRICT_EXTERNAL_AUDIT_POLICY_V1,
} from "./ExternalAuditComplianceGate";
import {
  appendExternalComplianceReceipt,
  createExternalComplianceReceipt,
  createExternalTrustRegistry,
} from "./ExternalComplianceRegistry";
import {
  createSignedExternalComplianceAnchor,
  createTrustedAuditorKey,
} from "./SignedExternalTrustAnchor";
import {
  createTrustedAuditorKeyRegistry,
  registerTrustedAuditorKey,
} from "./TrustedAuditorKeyRegistry";
import { createSignedAnchorRegistryBinding } from "./SignedAnchorRegistryBinding";
import { createEndToEndExternalTrustProof } from "./EndToEndExternalTrustProof";
import {
  assertTrustProofAccepted,
  consumeEndToEndExternalTrustProof,
} from "./TrustProofConsumerGate";

function publication(): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-62",
    package_hash: "pkg-hash-62",
    target: "HNK_VERSE" as const,
    action: "HNK_VERSE_ADMITTED" as const,
    registry_ref: "hnk_verse://goodle/pkg-62",
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "publication-62",
    receipt_hash: sha256Json(unsigned),
  };
}

function allowedExecute(): DistributionAvailabilityDecisionV1 {
  return {
    schema: "goodle.distribution-availability-decision.v1",
    package_id: "pkg-62",
    package_hash: "pkg-hash-62",
    target: "HNK_VERSE",
    state: "ACTIVE",
    capability: "EXECUTE",
    decision: "ALLOWED",
    available: true,
  };
}

function proofWithExecution(status: "SUCCEEDED" | "FAILED") {
  const lifecycle = appendPublicationLifecycleEvent(
    createPublicationLifecycleLedger(),
    { kind: "PUBLICATION", receipt: publication() },
  );

  const distribution = createUnifiedDistributionRegistry({
    package_id: "pkg-62",
    package_hash: "pkg-hash-62",
    lifecycle_ledgers: [lifecycle],
  });

  const usage = appendDistributionAccessReceipt(
    createDistributionUsageChronicle(),
    createDistributionAccessReceipt({
      decision: allowedExecute(),
      status,
      result_ref:
        status === "SUCCEEDED" ? "execute://pkg-62" : undefined,
      error_code:
        status === "FAILED" ? "BOOT_FAILED" : undefined,
    }),
  );

  const attestation = createDistributionUsageAttestation({
    registry: distribution,
    chronicle: usage,
  });

  const audit = createDistributionAuditPackage({
    lifecycle_ledgers: [lifecycle],
    distribution_registry: distribution,
    usage_chronicle: usage,
    usage_attestation: attestation,
  });

  const compliance = evaluateExternalAuditCompliance({
    audit,
    policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
  });

  const receipt = createExternalComplianceReceipt(compliance);
  const trustRegistry = appendExternalComplianceReceipt(
    createExternalTrustRegistry(),
    receipt,
  );

  const pair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const key = createTrustedAuditorKey({
    key_id: "key-62",
    auditor_id: "auditor-62",
    public_key_pem: pair.publicKey,
  });

  const keyRegistry = registerTrustedAuditorKey({
    registry: createTrustedAuditorKeyRegistry(),
    key,
  });

  const anchor = createSignedExternalComplianceAnchor({
    receipt,
    trusted_key: key,
    private_key_pem: pair.privateKey,
  });

  const binding = createSignedAnchorRegistryBinding({
    anchor,
    receipt,
    trusted_key: key,
    key_registry: keyRegistry,
    key_registry_sequence: 1,
  });

  return createEndToEndExternalTrustProof({
    audit_package: audit,
    compliance_policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
    compliance_result: compliance,
    compliance_receipt: receipt,
    external_trust_registry: trustRegistry,
    signed_anchor: anchor,
    trusted_auditor_key: key,
    trusted_auditor_key_registry: keyRegistry,
    anchor_registry_binding: binding,
  });
}

describe("M62 Trust Proof Consumer / Acceptance Gate", () => {
  it("accepts a valid compliant proof", () => {
    const result = consumeEndToEndExternalTrustProof({
      proof: proofWithExecution("SUCCEEDED"),
    });

    expect(result).toMatchObject({
      decision: "ACCEPT",
      accepted: true,
      review_required: false,
      rejected: false,
    });

    expect(() => assertTrustProofAccepted(result)).not.toThrow();
  });

  it("routes valid REVIEW_REQUIRED proof to manual review", () => {
    const result = consumeEndToEndExternalTrustProof({
      proof: proofWithExecution("FAILED"),
    });

    expect(result).toMatchObject({
      decision: "REVIEW",
      accepted: false,
      review_required: true,
      rejected: false,
    });
    expect(result.reasons).toContain("COMPLIANCE_REVIEW_REQUIRED");
  });

  it("rejects a structurally invalid proof", () => {
    const proof = proofWithExecution("SUCCEEDED");

    const result = consumeEndToEndExternalTrustProof({
      proof: {
        ...proof,
        package_hash: "tampered",
      },
    });

    expect(result.decision).toBe("REJECT");
    expect(result.accepted).toBe(false);
    expect(result.rejected).toBe(true);
    expect(result.reasons).toContain("END_TO_END_PROOF_HASH_INVALID");
  });

  it("allows policy to keep invalid proof out of automatic reject path", () => {
    const proof = proofWithExecution("SUCCEEDED");

    const result = consumeEndToEndExternalTrustProof({
      proof: {
        ...proof,
        package_hash: "tampered",
      },
      policy: {
        reject_on_invalid_proof: false,
        accept_only_compliant: true,
        review_on_compliance_review_required: true,
      },
    });

    expect(result.decision).toBe("REVIEW");
    expect(result.accepted).toBe(false);
    expect(result.review_required).toBe(true);
    expect(result.verification.valid).toBe(false);
    expect(result.reasons).toContain("INVALID_PROOF_REQUIRES_REVIEW");
  });
});
