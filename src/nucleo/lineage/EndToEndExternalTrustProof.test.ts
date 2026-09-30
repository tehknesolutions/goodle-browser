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
import {
  createEndToEndExternalTrustProof,
  verifyEndToEndExternalTrustProof,
} from "./EndToEndExternalTrustProof";

function publication(): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-61",
    package_hash: "pkg-hash-61",
    target: "HNK_VERSE" as const,
    action: "HNK_VERSE_ADMITTED" as const,
    registry_ref: "hnk_verse://goodle/pkg-61",
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "publication-61",
    receipt_hash: sha256Json(unsigned),
  };
}

function allowedExecute(): DistributionAvailabilityDecisionV1 {
  return {
    schema: "goodle.distribution-availability-decision.v1",
    package_id: "pkg-61",
    package_hash: "pkg-hash-61",
    target: "HNK_VERSE",
    state: "ACTIVE",
    capability: "EXECUTE",
    decision: "ALLOWED",
    available: true,
  };
}

function fixture() {
  const lifecycle = appendPublicationLifecycleEvent(
    createPublicationLifecycleLedger(),
    { kind: "PUBLICATION", receipt: publication() },
  );

  const distribution = createUnifiedDistributionRegistry({
    package_id: "pkg-61",
    package_hash: "pkg-hash-61",
    lifecycle_ledgers: [lifecycle],
  });

  const access = createDistributionAccessReceipt({
    decision: allowedExecute(),
    status: "SUCCEEDED",
    result_ref: "execute://pkg-61",
  });

  const usage = appendDistributionAccessReceipt(
    createDistributionUsageChronicle(),
    access,
  );

  const usageAttestation = createDistributionUsageAttestation({
    registry: distribution,
    chronicle: usage,
  });

  const audit = createDistributionAuditPackage({
    lifecycle_ledgers: [lifecycle],
    distribution_registry: distribution,
    usage_chronicle: usage,
    usage_attestation: usageAttestation,
  });

  const compliance = evaluateExternalAuditCompliance({
    audit,
    policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
  });

  const receipt = createExternalComplianceReceipt(compliance);
  const externalRegistry = appendExternalComplianceReceipt(
    createExternalTrustRegistry(),
    receipt,
  );

  const pair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const key = createTrustedAuditorKey({
    key_id: "key-61",
    auditor_id: "auditor-61",
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

  return {
    audit,
    compliance,
    receipt,
    externalRegistry,
    key,
    keyRegistry,
    anchor,
    binding,
  };
}

describe("M61 End-to-End External Trust Proof", () => {
  it("verifies the complete M55-M60 trust chain in one proof", () => {
    const f = fixture();

    const proof = createEndToEndExternalTrustProof({
      audit_package: f.audit,
      compliance_policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
      compliance_result: f.compliance,
      compliance_receipt: f.receipt,
      external_trust_registry: f.externalRegistry,
      signed_anchor: f.anchor,
      trusted_auditor_key: f.key,
      trusted_auditor_key_registry: f.keyRegistry,
      anchor_registry_binding: f.binding,
    });

    expect(proof).toMatchObject({
      package_id: "pkg-61",
      package_hash: "pkg-hash-61",
    });

    expect(verifyEndToEndExternalTrustProof(proof)).toMatchObject({
      valid: true,
      reasons: [],
    });
  });

  it("detects policy/result mismatch", () => {
    const f = fixture();

    expect(() =>
      createEndToEndExternalTrustProof({
        audit_package: f.audit,
        compliance_policy: {
          ...STRICT_EXTERNAL_AUDIT_POLICY_V1,
          require_active_targets: ["MARKETPLACE"],
        },
        compliance_result: f.compliance,
        compliance_receipt: f.receipt,
        external_trust_registry: f.externalRegistry,
        signed_anchor: f.anchor,
        trusted_auditor_key: f.key,
        trusted_auditor_key_registry: f.keyRegistry,
        anchor_registry_binding: f.binding,
      }),
    ).toThrow("COMPLIANCE_RESULT_RECOMPUTE_MISMATCH");
  });

  it("detects a compliance receipt missing from the trust registry", () => {
    const f = fixture();

    expect(() =>
      createEndToEndExternalTrustProof({
        audit_package: f.audit,
        compliance_policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
        compliance_result: f.compliance,
        compliance_receipt: f.receipt,
        external_trust_registry: createExternalTrustRegistry(),
        signed_anchor: f.anchor,
        trusted_auditor_key: f.key,
        trusted_auditor_key_registry: f.keyRegistry,
        anchor_registry_binding: f.binding,
      }),
    ).toThrow("COMPLIANCE_RECEIPT_NOT_IN_REGISTRY");
  });

  it("detects top-level proof tampering", () => {
    const f = fixture();

    const proof = createEndToEndExternalTrustProof({
      audit_package: f.audit,
      compliance_policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
      compliance_result: f.compliance,
      compliance_receipt: f.receipt,
      external_trust_registry: f.externalRegistry,
      signed_anchor: f.anchor,
      trusted_auditor_key: f.key,
      trusted_auditor_key_registry: f.keyRegistry,
      anchor_registry_binding: f.binding,
    });

    const verification = verifyEndToEndExternalTrustProof({
      ...proof,
      package_hash: "tampered",
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain(
      "END_TO_END_PROOF_HASH_INVALID",
    );
  });
});
