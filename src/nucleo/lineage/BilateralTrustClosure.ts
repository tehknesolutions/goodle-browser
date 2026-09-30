import type { EndToEndExternalTrustProofV1 } from "./EndToEndExternalTrustProof";
import { verifyEndToEndExternalTrustProof } from "./EndToEndExternalTrustProof";
import type {
  TrustProofConsumerPolicyV1,
  TrustProofConsumerResultV1,
} from "./TrustProofConsumerGate";
import { consumeEndToEndExternalTrustProof } from "./TrustProofConsumerGate";
import type {
  ConsumerDecisionChronicleV1,
  ConsumerDecisionReceiptV1,
} from "./ConsumerDecisionChronicle";
import {
  verifyConsumerDecisionChronicle,
  verifyConsumerDecisionReceipt,
} from "./ConsumerDecisionChronicle";
import type {
  ConsumerAuthorityKeyV1,
  ConsumerAuthorityRegistryV1,
  SignedConsumerDecisionV1,
} from "./SignedConsumerAuthority";
import {
  verifyConsumerAuthorityRegistry,
  verifySignedConsumerDecision,
} from "./SignedConsumerAuthority";
import { sha256Json } from "./BuildLedger";

export type BilateralTrustClosureV1 = {
  schema: "goodle.bilateral-trust-closure.v1";
  closure_id: string;
  proof_id: string;
  package_id: string;
  auditor_id: string;
  consumer_id: string;
  external_trust_proof: EndToEndExternalTrustProofV1;
  consumer_policy: TrustProofConsumerPolicyV1;
  consumer_result: TrustProofConsumerResultV1;
  consumer_decision_receipt: ConsumerDecisionReceiptV1;
  consumer_decision_chronicle: ConsumerDecisionChronicleV1;
  consumer_authority_key: ConsumerAuthorityKeyV1;
  consumer_authority_registry: ConsumerAuthorityRegistryV1;
  signed_consumer_decision: SignedConsumerDecisionV1;
  closure_hash: string;
};

export type BilateralTrustClosureVerificationV1 = {
  schema: "goodle.bilateral-trust-closure-verification.v1";
  valid: boolean;
  checks: {
    external_trust_proof: boolean;
    consumer_decision_recomputed: boolean;
    consumer_decision_receipt: boolean;
    consumer_chronicle: boolean;
    consumer_chronicle_link: boolean;
    consumer_authority_registry: boolean;
    signed_consumer_decision: boolean;
    bilateral_identity_chain: boolean;
    closure_hash: boolean;
  };
  reasons: string[];
};

function sameJson(a: unknown, b: unknown): boolean {
  return sha256Json(a) === sha256Json(b);
}

function chronicleContainsReceipt(input: {
  chronicle: ConsumerDecisionChronicleV1;
  receipt: ConsumerDecisionReceiptV1;
}): boolean {
  return input.chronicle.entries.some(
    (entry) =>
      entry.consumer_id === input.receipt.consumer_id &&
      entry.proof_id === input.receipt.proof_id &&
      entry.package_id === input.receipt.package_id &&
      entry.decision_receipt_id === input.receipt.receipt_id &&
      entry.decision_receipt_hash === input.receipt.receipt_hash &&
      entry.decision === input.receipt.decision,
  );
}

function bilateralIdentityValid(input: {
  proof: EndToEndExternalTrustProofV1;
  result: TrustProofConsumerResultV1;
  receipt: ConsumerDecisionReceiptV1;
  key: ConsumerAuthorityKeyV1;
  signed: SignedConsumerDecisionV1;
}): boolean {
  return (
    input.result.proof_id === input.proof.proof_id &&
    input.result.package_id === input.proof.package_id &&
    input.receipt.proof_id === input.proof.proof_id &&
    input.receipt.package_id === input.proof.package_id &&
    input.receipt.decision === input.result.decision &&
    input.receipt.consumer_id === input.key.consumer_id &&
    input.signed.consumer_id === input.key.consumer_id &&
    input.signed.proof_id === input.proof.proof_id &&
    input.signed.package_id === input.proof.package_id &&
    input.signed.decision === input.result.decision &&
    input.signed.decision_receipt_id === input.receipt.receipt_id &&
    input.signed.decision_receipt_hash === input.receipt.receipt_hash &&
    input.signed.key_id === input.key.key_id
  );
}

function verifyComponents(input: {
  external_trust_proof: EndToEndExternalTrustProofV1;
  consumer_policy: TrustProofConsumerPolicyV1;
  consumer_result: TrustProofConsumerResultV1;
  consumer_decision_receipt: ConsumerDecisionReceiptV1;
  consumer_decision_chronicle: ConsumerDecisionChronicleV1;
  consumer_authority_key: ConsumerAuthorityKeyV1;
  consumer_authority_registry: ConsumerAuthorityRegistryV1;
  signed_consumer_decision: SignedConsumerDecisionV1;
}): BilateralTrustClosureVerificationV1 {
  const reasons: string[] = [];

  const external_trust_proof =
    verifyEndToEndExternalTrustProof(input.external_trust_proof).valid;

  const recomputedConsumerResult = consumeEndToEndExternalTrustProof({
    proof: input.external_trust_proof,
    policy: input.consumer_policy,
  });

  const consumer_decision_recomputed = sameJson(
    recomputedConsumerResult,
    input.consumer_result,
  );

  const consumer_decision_receipt = verifyConsumerDecisionReceipt(
    input.consumer_decision_receipt,
  );

  const consumer_chronicle = verifyConsumerDecisionChronicle(
    input.consumer_decision_chronicle,
  );

  const consumer_chronicle_link =
    consumer_chronicle &&
    chronicleContainsReceipt({
      chronicle: input.consumer_decision_chronicle,
      receipt: input.consumer_decision_receipt,
    });

  const consumer_authority_registry = verifyConsumerAuthorityRegistry(
    input.consumer_authority_registry,
  );

  const signed_consumer_decision =
    consumer_authority_registry &&
    verifySignedConsumerDecision({
      signed: input.signed_consumer_decision,
      receipt: input.consumer_decision_receipt,
      key: input.consumer_authority_key,
      registry: input.consumer_authority_registry,
    });

  const bilateral_identity_chain = bilateralIdentityValid({
    proof: input.external_trust_proof,
    result: input.consumer_result,
    receipt: input.consumer_decision_receipt,
    key: input.consumer_authority_key,
    signed: input.signed_consumer_decision,
  });

  if (!external_trust_proof) reasons.push("EXTERNAL_TRUST_PROOF_INVALID");
  if (!consumer_decision_recomputed) reasons.push("CONSUMER_DECISION_RECOMPUTE_MISMATCH");
  if (!consumer_decision_receipt) reasons.push("CONSUMER_DECISION_RECEIPT_INVALID");
  if (!consumer_chronicle) reasons.push("CONSUMER_DECISION_CHRONICLE_INVALID");
  if (!consumer_chronicle_link) reasons.push("CONSUMER_DECISION_NOT_IN_CHRONICLE");
  if (!consumer_authority_registry) reasons.push("CONSUMER_AUTHORITY_REGISTRY_INVALID");
  if (!signed_consumer_decision) reasons.push("SIGNED_CONSUMER_DECISION_INVALID");
  if (!bilateral_identity_chain) reasons.push("BILATERAL_IDENTITY_CHAIN_INVALID");

  return {
    schema: "goodle.bilateral-trust-closure-verification.v1",
    valid:
      external_trust_proof &&
      consumer_decision_recomputed &&
      consumer_decision_receipt &&
      consumer_chronicle &&
      consumer_chronicle_link &&
      consumer_authority_registry &&
      signed_consumer_decision &&
      bilateral_identity_chain,
    checks: {
      external_trust_proof,
      consumer_decision_recomputed,
      consumer_decision_receipt,
      consumer_chronicle,
      consumer_chronicle_link,
      consumer_authority_registry,
      signed_consumer_decision,
      bilateral_identity_chain,
      closure_hash: true,
    },
    reasons,
  };
}

export function createBilateralTrustClosure(input: {
  external_trust_proof: EndToEndExternalTrustProofV1;
  consumer_policy: TrustProofConsumerPolicyV1;
  consumer_result: TrustProofConsumerResultV1;
  consumer_decision_receipt: ConsumerDecisionReceiptV1;
  consumer_decision_chronicle: ConsumerDecisionChronicleV1;
  consumer_authority_key: ConsumerAuthorityKeyV1;
  consumer_authority_registry: ConsumerAuthorityRegistryV1;
  signed_consumer_decision: SignedConsumerDecisionV1;
}): BilateralTrustClosureV1 {
  const verification = verifyComponents(input);
  if (!verification.valid) {
    throw new Error(
      `BILATERAL_TRUST_COMPONENTS_INVALID: ${verification.reasons.join(",")}`,
    );
  }

  const unsigned = {
    schema: "goodle.bilateral-trust-closure.v1" as const,
    proof_id: input.external_trust_proof.proof_id,
    package_id: input.external_trust_proof.package_id,
    auditor_id: input.external_trust_proof.trusted_auditor_key.auditor_id,
    consumer_id: input.consumer_authority_key.consumer_id,
    external_trust_proof: input.external_trust_proof,
    consumer_policy: input.consumer_policy,
    consumer_result: input.consumer_result,
    consumer_decision_receipt: input.consumer_decision_receipt,
    consumer_decision_chronicle: input.consumer_decision_chronicle,
    consumer_authority_key: input.consumer_authority_key,
    consumer_authority_registry: input.consumer_authority_registry,
    signed_consumer_decision: input.signed_consumer_decision,
  };

  const closure_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    closure_id: `bilateral-trust-${closure_hash.slice(0, 16)}`,
    closure_hash,
  };
}

export function verifyBilateralTrustClosure(
  closure: BilateralTrustClosureV1,
): BilateralTrustClosureVerificationV1 {
  const verification = verifyComponents({
    external_trust_proof: closure.external_trust_proof,
    consumer_policy: closure.consumer_policy,
    consumer_result: closure.consumer_result,
    consumer_decision_receipt: closure.consumer_decision_receipt,
    consumer_decision_chronicle: closure.consumer_decision_chronicle,
    consumer_authority_key: closure.consumer_authority_key,
    consumer_authority_registry: closure.consumer_authority_registry,
    signed_consumer_decision: closure.signed_consumer_decision,
  });

  const {
    closure_id: _closureId,
    closure_hash,
    ...unsigned
  } = closure;

  const closure_hash_valid =
    closure.proof_id === closure.external_trust_proof.proof_id &&
    closure.package_id === closure.external_trust_proof.package_id &&
    closure.auditor_id === closure.external_trust_proof.trusted_auditor_key.auditor_id &&
    closure.consumer_id === closure.consumer_authority_key.consumer_id &&
    sha256Json(unsigned) === closure_hash;

  const reasons = [...verification.reasons];
  if (!closure_hash_valid) reasons.push("BILATERAL_TRUST_CLOSURE_HASH_INVALID");

  return {
    ...verification,
    valid: verification.valid && closure_hash_valid,
    checks: {
      ...verification.checks,
      closure_hash: closure_hash_valid,
    },
    reasons,
  };
}
