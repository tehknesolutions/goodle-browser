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
  consumeEndToEndExternalTrustProof,
  STRICT_TRUST_PROOF_CONSUMER_POLICY_V1,
} from "./TrustProofConsumerGate";
import {
  appendConsumerDecisionReceipt,
  createConsumerDecisionChronicle,
  createConsumerDecisionReceipt,
} from "./ConsumerDecisionChronicle";
import {
  createConsumerAuthorityKey,
  createConsumerAuthorityRegistry,
  createSignedConsumerDecision,
  registerConsumerAuthorityKey,
} from "./SignedConsumerAuthority";
import {
  createBilateralTrustClosure,
  verifyBilateralTrustClosure,
} from "./BilateralTrustClosure";

function publication(): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-65",
    package_hash: "pkg-hash-65",
    target: "HNK_VERSE" as const,
    action: "HNK_VERSE_ADMITTED" as const,
    registry_ref: "hnk_verse://goodle/pkg-65",
    status: "COMPLETED" as const,
  };
  return {
    ...unsigned,
    receipt_id: "publication-65",
    receipt_hash: sha256Json(unsigned),
  };
}

function allowedExecute(): DistributionAvailabilityDecisionV1 {
  return {
    schema: "goodle.distribution-availability-decision.v1",
    package_id: "pkg-65",
    package_hash: "pkg-hash-65",
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
    package_id: "pkg-65",
    package_hash: "pkg-hash-65",
    lifecycle_ledgers: [lifecycle],
  });

  const usage = appendDistributionAccessReceipt(
    createDistributionUsageChronicle(),
    createDistributionAccessReceipt({
      decision: allowedExecute(),
      status: "SUCCEEDED",
      result_ref: "execute://pkg-65",
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

  const complianceReceipt = createExternalComplianceReceipt(compliance);
  const externalRegistry = appendExternalComplianceReceipt(
    createExternalTrustRegistry(),
    complianceReceipt,
  );

  const auditorPair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const auditorKey = createTrustedAuditorKey({
    key_id: "auditor-key-65",
    auditor_id: "auditor-65",
    public_key_pem: auditorPair.publicKey,
  });
  const auditorRegistry = registerTrustedAuditorKey({
    registry: createTrustedAuditorKeyRegistry(),
    key: auditorKey,
  });
  const anchor = createSignedExternalComplianceAnchor({
    receipt: complianceReceipt,
    trusted_key: auditorKey,
    private_key_pem: auditorPair.privateKey,
  });
  const binding = createSignedAnchorRegistryBinding({
    anchor,
    receipt: complianceReceipt,
    trusted_key: auditorKey,
    key_registry: auditorRegistry,
    key_registry_sequence: 1,
  });

  const externalProof = createEndToEndExternalTrustProof({
    audit_package: audit,
    compliance_policy: STRICT_EXTERNAL_AUDIT_POLICY_V1,
    compliance_result: compliance,
    compliance_receipt: complianceReceipt,
    external_trust_registry: externalRegistry,
    signed_anchor: anchor,
    trusted_auditor_key: auditorKey,
    trusted_auditor_key_registry: auditorRegistry,
    anchor_registry_binding: binding,
  });

  const consumerResult = consumeEndToEndExternalTrustProof({
    proof: externalProof,
    policy: STRICT_TRUST_PROOF_CONSUMER_POLICY_V1,
  });
  const decisionReceipt = createConsumerDecisionReceipt({
    consumer_id: "consumer-65",
    result: consumerResult,
  });
  const chronicle = appendConsumerDecisionReceipt({
    chronicle: createConsumerDecisionChronicle(),
    receipt: decisionReceipt,
  });

  const consumerPair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const consumerKey = createConsumerAuthorityKey({
    consumer_id: "consumer-65",
    key_id: "consumer-key-65",
    public_key_pem: consumerPair.publicKey,
  });
  const consumerRegistry = registerConsumerAuthorityKey({
    registry: createConsumerAuthorityRegistry(),
    key: consumerKey,
  });
  const signedDecision = createSignedConsumerDecision({
    receipt: decisionReceipt,
    key: consumerKey,
    registry: consumerRegistry,
    registry_sequence: 1,
    private_key_pem: consumerPair.privateKey,
  });

  return {
    externalProof,
    consumerResult,
    decisionReceipt,
    chronicle,
    consumerKey,
    consumerRegistry,
    signedDecision,
  };
}

describe("M65 Bilateral Trust Closure", () => {
  it("closes the auditor and consumer trust chains into one valid proof", () => {
    const f = fixture();
    const closure = createBilateralTrustClosure({
      external_trust_proof: f.externalProof,
      consumer_policy: STRICT_TRUST_PROOF_CONSUMER_POLICY_V1,
      consumer_result: f.consumerResult,
      consumer_decision_receipt: f.decisionReceipt,
      consumer_decision_chronicle: f.chronicle,
      consumer_authority_key: f.consumerKey,
      consumer_authority_registry: f.consumerRegistry,
      signed_consumer_decision: f.signedDecision,
    });

    expect(closure).toMatchObject({
      proof_id: f.externalProof.proof_id,
      package_id: "pkg-65",
      auditor_id: "auditor-65",
      consumer_id: "consumer-65",
    });
    expect(verifyBilateralTrustClosure(closure)).toMatchObject({
      valid: true,
      reasons: [],
    });
  });

  it("rejects a consumer result that cannot be recomputed from the proof and policy", () => {
    const f = fixture();

    expect(() =>
      createBilateralTrustClosure({
        external_trust_proof: f.externalProof,
        consumer_policy: STRICT_TRUST_PROOF_CONSUMER_POLICY_V1,
        consumer_result: {
          ...f.consumerResult,
          decision: "REVIEW",
          accepted: false,
          review_required: true,
        },
        consumer_decision_receipt: f.decisionReceipt,
        consumer_decision_chronicle: f.chronicle,
        consumer_authority_key: f.consumerKey,
        consumer_authority_registry: f.consumerRegistry,
        signed_consumer_decision: f.signedDecision,
      }),
    ).toThrow("CONSUMER_DECISION_RECOMPUTE_MISMATCH");
  });

  it("detects top-level bilateral closure tampering", () => {
    const f = fixture();
    const closure = createBilateralTrustClosure({
      external_trust_proof: f.externalProof,
      consumer_policy: STRICT_TRUST_PROOF_CONSUMER_POLICY_V1,
      consumer_result: f.consumerResult,
      consumer_decision_receipt: f.decisionReceipt,
      consumer_decision_chronicle: f.chronicle,
      consumer_authority_key: f.consumerKey,
      consumer_authority_registry: f.consumerRegistry,
      signed_consumer_decision: f.signedDecision,
    });

    const verification = verifyBilateralTrustClosure({
      ...closure,
      consumer_id: "tampered-consumer",
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain(
      "BILATERAL_TRUST_CLOSURE_HASH_INVALID",
    );
  });
});
