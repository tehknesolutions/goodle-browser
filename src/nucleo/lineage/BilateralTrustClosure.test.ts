import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { EndToEndExternalTrustProofV1 } from "./EndToEndExternalTrustProof";
import type { TrustProofConsumerResultV1 } from "./TrustProofConsumerGate";
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

function externalProof(): EndToEndExternalTrustProofV1 {
  const base = {
    schema: "goodle.end-to-end-external-trust-proof.v1" as const,
    package_id: "pkg-65",
    package_hash: "pkg-hash-65",
    audit_package: {} as never,
    compliance_policy: {},
    compliance_result: {} as never,
    compliance_receipt: {} as never,
    external_trust_registry: {} as never,
    signed_anchor: {} as never,
    trusted_auditor_key: {
      schema: "goodle.trusted-auditor-key.v1" as const,
      key_id: "auditor-key-65",
      auditor_id: "auditor-65",
      algorithm: "Ed25519" as const,
      public_key_pem: "",
      public_key_fingerprint_sha256: "fp",
    },
    trusted_auditor_key_registry: {} as never,
    anchor_registry_binding: {} as never,
  };
  return {
    ...base,
    proof_id: "proof-65",
    proof_hash: sha256Json(base),
  };
}

function consumerResult(): TrustProofConsumerResultV1 {
  return {
    schema: "goodle.trust-proof-consumer-result.v1",
    proof_id: "proof-65",
    package_id: "pkg-65",
    decision: "ACCEPT",
    accepted: true,
    review_required: false,
    rejected: false,
    reasons: [],
    verification: {
      schema: "goodle.end-to-end-external-trust-verification.v1",
      valid: true,
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
        proof_hash: true,
      },
      reasons: [],
    },
  };
}

describe("M65 Bilateral Trust Closure", () => {
  it("rejects incomplete fake external proof before closure", () => {
    const result = consumerResult();
    const receipt = createConsumerDecisionReceipt({
      consumer_id: "consumer-65",
      result,
    });
    const chronicle = appendConsumerDecisionReceipt({
      chronicle: createConsumerDecisionChronicle(),
      receipt,
    });

    const pair = generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const key = createConsumerAuthorityKey({
      consumer_id: "consumer-65",
      key_id: "consumer-key-65",
      public_key_pem: pair.publicKey,
    });
    const registry = registerConsumerAuthorityKey({
      registry: createConsumerAuthorityRegistry(),
      key,
    });
    const signed = createSignedConsumerDecision({
      receipt,
      key,
      registry,
      registry_sequence: 1,
      private_key_pem: pair.privateKey,
    });

    expect(() =>
      createBilateralTrustClosure({
        external_trust_proof: externalProof(),
        consumer_policy: {},
        consumer_result: result,
        consumer_decision_receipt: receipt,
        consumer_decision_chronicle: chronicle,
        consumer_authority_key: key,
        consumer_authority_registry: registry,
        signed_consumer_decision: signed,
      }),
    ).toThrow("BILATERAL_TRUST_COMPONENTS_INVALID");
  });

  it("detects top-level closure tampering", () => {
    const fake = {
      schema: "goodle.bilateral-trust-closure.v1" as const,
      closure_id: "closure-65",
      proof_id: "proof-65",
      package_id: "pkg-65",
      auditor_id: "auditor-65",
      consumer_id: "consumer-65",
      external_trust_proof: externalProof(),
      consumer_policy: {},
      consumer_result: consumerResult(),
      consumer_decision_receipt: {} as never,
      consumer_decision_chronicle: {} as never,
      consumer_authority_key: {} as never,
      consumer_authority_registry: {} as never,
      signed_consumer_decision: {} as never,
      closure_hash: "tampered",
    };

    expect(verifyBilateralTrustClosure(fake).valid).toBe(false);
  });
});
