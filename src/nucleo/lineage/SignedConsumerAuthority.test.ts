import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { ConsumerDecisionReceiptV1 } from "./ConsumerDecisionChronicle";
import { sha256Json } from "./BuildLedger";
import {
  createConsumerAuthorityKey,
  createConsumerAuthorityRegistry,
  createSignedConsumerDecision,
  registerConsumerAuthorityKey,
  revokeConsumerAuthorityKey,
  rotateConsumerAuthorityKey,
  verifyConsumerAuthorityRegistry,
  verifySignedConsumerDecision,
} from "./SignedConsumerAuthority";

function receipt(): ConsumerDecisionReceiptV1 {
  const unsigned = {
    schema: "goodle.consumer-decision-receipt.v1" as const,
    consumer_id: "consumer-64",
    proof_id: "proof-64",
    package_id: "pkg-64",
    decision: "ACCEPT" as const,
    accepted: true,
    review_required: false,
    rejected: false,
    reasons: [] as string[],
  };
  return {
    ...unsigned,
    receipt_id: "consumer-decision-64",
    receipt_hash: sha256Json(unsigned),
  };
}

function key(id: string) {
  const pair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return {
    key: createConsumerAuthorityKey({
      consumer_id: "consumer-64",
      key_id: id,
      public_key_pem: pair.publicKey,
    }),
    privateKey: pair.privateKey,
  };
}

describe("M64 Signed Consumer Authority", () => {
  it("signs a consumer decision with an active registered key", () => {
    const signer = key("consumer-key-64a");
    const registry = registerConsumerAuthorityKey({
      registry: createConsumerAuthorityRegistry(),
      key: signer.key,
    });
    const signed = createSignedConsumerDecision({
      receipt: receipt(),
      key: signer.key,
      registry,
      registry_sequence: 1,
      private_key_pem: signer.privateKey,
    });

    expect(
      verifySignedConsumerDecision({
        signed,
        receipt: receipt(),
        key: signer.key,
        registry,
      }),
    ).toBe(true);
  });

  it("supports rotation and preserves historical validation", () => {
    const first = key("consumer-key-64a");
    const second = key("consumer-key-64b");
    let registry = registerConsumerAuthorityKey({
      registry: createConsumerAuthorityRegistry(),
      key: first.key,
    });
    const signed = createSignedConsumerDecision({
      receipt: receipt(),
      key: first.key,
      registry,
      registry_sequence: 1,
      private_key_pem: first.privateKey,
    });

    registry = rotateConsumerAuthorityKey({
      registry,
      current_key: first.key,
      next_key: second.key,
      reason_code: "SCHEDULED_ROTATION",
    });

    expect(verifyConsumerAuthorityRegistry(registry)).toBe(true);
    expect(
      verifySignedConsumerDecision({
        signed,
        receipt: receipt(),
        key: first.key,
        registry,
      }),
    ).toBe(true);
  });

  it("rejects signing after revocation", () => {
    const signer = key("consumer-key-64a");
    let registry = registerConsumerAuthorityKey({
      registry: createConsumerAuthorityRegistry(),
      key: signer.key,
    });
    registry = revokeConsumerAuthorityKey({
      registry,
      key: signer.key,
      reason_code: "COMPROMISED",
    });

    expect(() =>
      createSignedConsumerDecision({
        receipt: receipt(),
        key: signer.key,
        registry,
        registry_sequence: registry.entries.length,
        private_key_pem: signer.privateKey,
      }),
    ).toThrow("SIGNED_CONSUMER_DECISION_KEY_NOT_ACTIVE");
  });

  it("detects registry tampering", () => {
    const signer = key("consumer-key-64a");
    const registry = registerConsumerAuthorityKey({
      registry: createConsumerAuthorityRegistry(),
      key: signer.key,
    });
    expect(
      verifyConsumerAuthorityRegistry({
        ...registry,
        entries: registry.entries.map((entry) => ({
          ...entry,
          key_fingerprint_sha256: "tampered",
        })),
      }),
    ).toBe(false);
  });
});
