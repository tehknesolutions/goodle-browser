import type {
  TrustProofConsumerDecision,
  TrustProofConsumerResultV1,
} from "./TrustProofConsumerGate";
import { sha256Json } from "./BuildLedger";

export type ConsumerDecisionReceiptV1 = {
  schema: "goodle.consumer-decision-receipt.v1";
  receipt_id: string;
  consumer_id: string;
  proof_id: string;
  package_id: string;
  decision: TrustProofConsumerDecision;
  accepted: boolean;
  review_required: boolean;
  rejected: boolean;
  reasons: string[];
  receipt_hash: string;
};

export type ConsumerDecisionChronicleEntryV1 = {
  schema: "goodle.consumer-decision-chronicle-entry.v1";
  entry_id: string;
  sequence: number;
  consumer_id: string;
  proof_id: string;
  package_id: string;
  decision_receipt_id: string;
  decision_receipt_hash: string;
  decision: TrustProofConsumerDecision;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type ConsumerDecisionChronicleV1 = {
  schema: "goodle.consumer-decision-chronicle.v1";
  entries: ConsumerDecisionChronicleEntryV1[];
  head_hash?: string;
  chronicle_hash: string;
};

function chronicleHash(
  entries: ConsumerDecisionChronicleEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.consumer-decision-chronicle.v1",
    entries,
    head_hash,
  });
}

export function createConsumerDecisionReceipt(input: {
  consumer_id: string;
  result: TrustProofConsumerResultV1;
}): ConsumerDecisionReceiptV1 {
  if (!input.consumer_id.trim()) {
    throw new Error("CONSUMER_DECISION_CONSUMER_ID_REQUIRED");
  }

  const unsigned = {
    schema: "goodle.consumer-decision-receipt.v1" as const,
    consumer_id: input.consumer_id,
    proof_id: input.result.proof_id,
    package_id: input.result.package_id,
    decision: input.result.decision,
    accepted: input.result.accepted,
    review_required: input.result.review_required,
    rejected: input.result.rejected,
    reasons: [...input.result.reasons],
  };

  const receipt_hash = sha256Json(unsigned);
  return {
    ...unsigned,
    receipt_id: `consumer-decision-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function verifyConsumerDecisionReceipt(
  receipt: ConsumerDecisionReceiptV1,
): boolean {
  const semantics =
    (receipt.decision === "ACCEPT" &&
      receipt.accepted &&
      !receipt.review_required &&
      !receipt.rejected) ||
    (receipt.decision === "REVIEW" &&
      !receipt.accepted &&
      receipt.review_required &&
      !receipt.rejected) ||
    (receipt.decision === "REJECT" &&
      !receipt.accepted &&
      !receipt.review_required &&
      receipt.rejected);

  if (!semantics) return false;

  const { receipt_id: _receiptId, receipt_hash, ...unsigned } = receipt;
  return sha256Json(unsigned) === receipt_hash;
}

export function createConsumerDecisionChronicle(): ConsumerDecisionChronicleV1 {
  const entries: ConsumerDecisionChronicleEntryV1[] = [];
  return {
    schema: "goodle.consumer-decision-chronicle.v1",
    entries,
    head_hash: undefined,
    chronicle_hash: chronicleHash(entries, undefined),
  };
}

export function appendConsumerDecisionReceipt(input: {
  chronicle: ConsumerDecisionChronicleV1;
  receipt: ConsumerDecisionReceiptV1;
}): ConsumerDecisionChronicleV1 {
  if (!verifyConsumerDecisionChronicle(input.chronicle)) {
    throw new Error("CONSUMER_DECISION_CHRONICLE_INTEGRITY_FAILED");
  }
  if (!verifyConsumerDecisionReceipt(input.receipt)) {
    throw new Error("CONSUMER_DECISION_RECEIPT_INVALID");
  }
  if (
    input.chronicle.entries.some(
      (entry) => entry.decision_receipt_id === input.receipt.receipt_id,
    )
  ) {
    throw new Error("CONSUMER_DECISION_RECEIPT_ALREADY_RECORDED");
  }

  const unsigned = {
    schema: "goodle.consumer-decision-chronicle-entry.v1" as const,
    sequence: input.chronicle.entries.length + 1,
    consumer_id: input.receipt.consumer_id,
    proof_id: input.receipt.proof_id,
    package_id: input.receipt.package_id,
    decision_receipt_id: input.receipt.receipt_id,
    decision_receipt_hash: input.receipt.receipt_hash,
    decision: input.receipt.decision,
    previous_entry_hash: input.chronicle.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: ConsumerDecisionChronicleEntryV1 = {
    ...unsigned,
    entry_id: `consumer-decision-entry-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
    entry_hash,
  };

  const entries = [...input.chronicle.entries, entry];
  return {
    schema: input.chronicle.schema,
    entries,
    head_hash: entry_hash,
    chronicle_hash: chronicleHash(entries, entry_hash),
  };
}

export function verifyConsumerDecisionChronicle(
  chronicle: ConsumerDecisionChronicleV1,
): boolean {
  let previous: string | undefined;

  for (let index = 0; index < chronicle.entries.length; index += 1) {
    const entry = chronicle.entries[index];
    if (!entry) return false;
    if (entry.sequence !== index + 1) return false;
    if (entry.previous_entry_hash !== previous) return false;

    const { entry_id: _entryId, entry_hash, ...unsigned } = entry;
    if (sha256Json(unsigned) !== entry_hash) return false;
    previous = entry_hash;
  }

  const expectedHead = chronicle.entries.at(-1)?.entry_hash;
  if (chronicle.head_hash !== expectedHead) return false;

  return chronicle.chronicle_hash ===
    chronicleHash(chronicle.entries, chronicle.head_hash);
}

export function latestConsumerDecisionForProof(input: {
  chronicle: ConsumerDecisionChronicleV1;
  proof_id: string;
  consumer_id?: string;
}): TrustProofConsumerDecision | "UNDECIDED" {
  if (!verifyConsumerDecisionChronicle(input.chronicle)) {
    throw new Error("CONSUMER_DECISION_CHRONICLE_INTEGRITY_FAILED");
  }

  const latest = [...input.chronicle.entries]
    .reverse()
    .find(
      (entry) =>
        entry.proof_id === input.proof_id &&
        (!input.consumer_id || entry.consumer_id === input.consumer_id),
    );

  return latest?.decision ?? "UNDECIDED";
}
