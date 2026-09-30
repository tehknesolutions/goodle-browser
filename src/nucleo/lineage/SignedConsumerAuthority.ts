import {
  createHash,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import type { ConsumerDecisionReceiptV1 } from "./ConsumerDecisionChronicle";
import { verifyConsumerDecisionReceipt } from "./ConsumerDecisionChronicle";
import { sha256Json } from "./BuildLedger";

export type ConsumerAuthorityKeyV1 = {
  schema: "goodle.consumer-authority-key.v1";
  consumer_id: string;
  key_id: string;
  algorithm: "Ed25519";
  public_key_pem: string;
  public_key_fingerprint_sha256: string;
};

export type ConsumerAuthorityRegistryEntryV1 = {
  schema: "goodle.consumer-authority-registry-entry.v1";
  entry_id: string;
  sequence: number;
  action: "REGISTER" | "ROTATE" | "REVOKE";
  consumer_id: string;
  key_id: string;
  key_fingerprint_sha256: string;
  successor_key_id?: string;
  reason_code?: string;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type ConsumerAuthorityRegistryV1 = {
  schema: "goodle.consumer-authority-registry.v1";
  entries: ConsumerAuthorityRegistryEntryV1[];
  head_hash?: string;
  registry_hash: string;
};

export type SignedConsumerDecisionV1 = {
  schema: "goodle.signed-consumer-decision.v1";
  signed_decision_id: string;
  decision_receipt_id: string;
  decision_receipt_hash: string;
  consumer_id: string;
  proof_id: string;
  package_id: string;
  decision: ConsumerDecisionReceiptV1["decision"];
  key_id: string;
  authority_registry_snapshot_hash: string;
  authority_registry_sequence: number;
  public_key_fingerprint_sha256: string;
  signed_payload_hash: string;
  signature_base64: string;
  signed_decision_hash: string;
};

function fingerprint(publicKeyPem: string): string {
  const der = createPublicKey(publicKeyPem).export({
    format: "der",
    type: "spki",
  });
  return createHash("sha256").update(der).digest("hex");
}

function registryHash(
  entries: ConsumerAuthorityRegistryEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.consumer-authority-registry.v1",
    entries,
    head_hash,
  });
}

function registrySnapshotHash(
  registry: ConsumerAuthorityRegistryV1,
  sequence: number,
): string {
  if (sequence < 1 || sequence > registry.entries.length) {
    throw new Error("CONSUMER_AUTHORITY_SEQUENCE_INVALID");
  }
  const entries = registry.entries.slice(0, sequence);
  return registryHash(entries, entries.at(-1)?.entry_hash);
}

export function createConsumerAuthorityKey(input: {
  consumer_id: string;
  key_id: string;
  public_key_pem: string;
}): ConsumerAuthorityKeyV1 {
  if (!input.consumer_id.trim()) throw new Error("CONSUMER_AUTHORITY_ID_REQUIRED");
  if (!input.key_id.trim()) throw new Error("CONSUMER_AUTHORITY_KEY_ID_REQUIRED");

  return {
    schema: "goodle.consumer-authority-key.v1",
    consumer_id: input.consumer_id,
    key_id: input.key_id,
    algorithm: "Ed25519",
    public_key_pem: input.public_key_pem,
    public_key_fingerprint_sha256: fingerprint(input.public_key_pem),
  };
}

export function createConsumerAuthorityRegistry(): ConsumerAuthorityRegistryV1 {
  const entries: ConsumerAuthorityRegistryEntryV1[] = [];
  return {
    schema: "goodle.consumer-authority-registry.v1",
    entries,
    head_hash: undefined,
    registry_hash: registryHash(entries),
  };
}

function verifyRegistry(registry: ConsumerAuthorityRegistryV1): boolean {
  let previous: string | undefined;
  for (let i = 0; i < registry.entries.length; i += 1) {
    const entry = registry.entries[i];
    if (!entry || entry.sequence !== i + 1 || entry.previous_entry_hash !== previous) return false;
    const { entry_id: _entryId, entry_hash, ...unsigned } = entry;
    if (sha256Json(unsigned) !== entry_hash) return false;
    previous = entry_hash;
  }
  if (registry.head_hash !== registry.entries.at(-1)?.entry_hash) return false;
  return registry.registry_hash === registryHash(registry.entries, registry.head_hash);
}

function appendEvent(
  registry: ConsumerAuthorityRegistryV1,
  event: Omit<ConsumerAuthorityRegistryEntryV1, "schema" | "entry_id" | "sequence" | "previous_entry_hash" | "entry_hash">,
): ConsumerAuthorityRegistryV1 {
  if (!verifyRegistry(registry)) throw new Error("CONSUMER_AUTHORITY_REGISTRY_INVALID");
  const unsigned = {
    schema: "goodle.consumer-authority-registry-entry.v1" as const,
    sequence: registry.entries.length + 1,
    ...event,
    previous_entry_hash: registry.head_hash,
  };
  const entry_hash = sha256Json(unsigned);
  const entry = {
    ...unsigned,
    entry_id: `consumer-authority-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
    entry_hash,
  };
  const entries = [...registry.entries, entry];
  return {
    schema: registry.schema,
    entries,
    head_hash: entry_hash,
    registry_hash: registryHash(entries, entry_hash),
  };
}

function stateAt(
  registry: ConsumerAuthorityRegistryV1,
  key: ConsumerAuthorityKeyV1,
  sequence: number,
): "ACTIVE" | "ROTATED" | "REVOKED" | "UNKNOWN" {
  if (!verifyRegistry(registry)) throw new Error("CONSUMER_AUTHORITY_REGISTRY_INVALID");
  const relevant = registry.entries.filter(
    (entry) => entry.key_id === key.key_id && entry.sequence <= sequence,
  );
  const registration = relevant.find((entry) => entry.action === "REGISTER");
  if (!registration) return "UNKNOWN";
  if (
    registration.consumer_id !== key.consumer_id ||
    registration.key_fingerprint_sha256 !== key.public_key_fingerprint_sha256
  ) return "UNKNOWN";
  const terminal = relevant.find(
    (entry) => entry.action === "ROTATE" || entry.action === "REVOKE",
  );
  return terminal?.action === "ROTATE"
    ? "ROTATED"
    : terminal?.action === "REVOKE"
      ? "REVOKED"
      : "ACTIVE";
}

export function registerConsumerAuthorityKey(input: {
  registry: ConsumerAuthorityRegistryV1;
  key: ConsumerAuthorityKeyV1;
}): ConsumerAuthorityRegistryV1 {
  if (input.registry.entries.some((e) => e.key_id === input.key.key_id)) {
    throw new Error("CONSUMER_AUTHORITY_KEY_ALREADY_REGISTERED");
  }
  const hasActive = input.registry.entries
    .filter((e) => e.consumer_id === input.key.consumer_id && e.action === "REGISTER")
    .some((e) => stateAt(input.registry, {
      ...input.key,
      key_id: e.key_id,
      public_key_fingerprint_sha256: e.key_fingerprint_sha256,
    }, input.registry.entries.length) === "ACTIVE");

  if (hasActive) throw new Error("CONSUMER_AUTHORITY_ACTIVE_KEY_EXISTS");

  return appendEvent(input.registry, {
    action: "REGISTER",
    consumer_id: input.key.consumer_id,
    key_id: input.key.key_id,
    key_fingerprint_sha256: input.key.public_key_fingerprint_sha256,
  });
}

export function rotateConsumerAuthorityKey(input: {
  registry: ConsumerAuthorityRegistryV1;
  current_key: ConsumerAuthorityKeyV1;
  next_key: ConsumerAuthorityKeyV1;
  reason_code: string;
}): ConsumerAuthorityRegistryV1 {
  if (!input.reason_code.trim()) throw new Error("CONSUMER_AUTHORITY_ROTATION_REASON_REQUIRED");
  if (input.current_key.consumer_id !== input.next_key.consumer_id) {
    throw new Error("CONSUMER_AUTHORITY_ROTATION_ID_MISMATCH");
  }
  if (stateAt(input.registry, input.current_key, input.registry.entries.length) !== "ACTIVE") {
    throw new Error("CONSUMER_AUTHORITY_ROTATION_REQUIRES_ACTIVE_KEY");
  }
  let registry = appendEvent(input.registry, {
    action: "ROTATE",
    consumer_id: input.current_key.consumer_id,
    key_id: input.current_key.key_id,
    key_fingerprint_sha256: input.current_key.public_key_fingerprint_sha256,
    successor_key_id: input.next_key.key_id,
    reason_code: input.reason_code,
  });
  registry = appendEvent(registry, {
    action: "REGISTER",
    consumer_id: input.next_key.consumer_id,
    key_id: input.next_key.key_id,
    key_fingerprint_sha256: input.next_key.public_key_fingerprint_sha256,
    reason_code: input.reason_code,
  });
  return registry;
}

export function revokeConsumerAuthorityKey(input: {
  registry: ConsumerAuthorityRegistryV1;
  key: ConsumerAuthorityKeyV1;
  reason_code: string;
}): ConsumerAuthorityRegistryV1 {
  if (!input.reason_code.trim()) throw new Error("CONSUMER_AUTHORITY_REVOCATION_REASON_REQUIRED");
  if (stateAt(input.registry, input.key, input.registry.entries.length) !== "ACTIVE") {
    throw new Error("CONSUMER_AUTHORITY_REVOCATION_REQUIRES_ACTIVE_KEY");
  }
  return appendEvent(input.registry, {
    action: "REVOKE",
    consumer_id: input.key.consumer_id,
    key_id: input.key.key_id,
    key_fingerprint_sha256: input.key.public_key_fingerprint_sha256,
    reason_code: input.reason_code,
  });
}

export function createSignedConsumerDecision(input: {
  receipt: ConsumerDecisionReceiptV1;
  key: ConsumerAuthorityKeyV1;
  registry: ConsumerAuthorityRegistryV1;
  registry_sequence: number;
  private_key_pem: string;
}): SignedConsumerDecisionV1 {
  if (!verifyConsumerDecisionReceipt(input.receipt)) {
    throw new Error("SIGNED_CONSUMER_DECISION_RECEIPT_INVALID");
  }
  if (input.receipt.consumer_id !== input.key.consumer_id) {
    throw new Error("SIGNED_CONSUMER_DECISION_CONSUMER_MISMATCH");
  }
  if (stateAt(input.registry, input.key, input.registry_sequence) !== "ACTIVE") {
    throw new Error("SIGNED_CONSUMER_DECISION_KEY_NOT_ACTIVE");
  }

  const payload = {
    schema: "goodle.signed-consumer-decision-payload.v1" as const,
    decision_receipt_id: input.receipt.receipt_id,
    decision_receipt_hash: input.receipt.receipt_hash,
    consumer_id: input.receipt.consumer_id,
    proof_id: input.receipt.proof_id,
    package_id: input.receipt.package_id,
    decision: input.receipt.decision,
    key_id: input.key.key_id,
    authority_registry_snapshot_hash: registrySnapshotHash(
      input.registry,
      input.registry_sequence,
    ),
    authority_registry_sequence: input.registry_sequence,
    public_key_fingerprint_sha256: input.key.public_key_fingerprint_sha256,
  };
  const signed_payload_hash = sha256Json(payload);
  const signature_base64 = sign(
    null,
    Buffer.from(signed_payload_hash, "utf8"),
    input.private_key_pem,
  ).toString("base64");

  const { schema: _payloadSchema, ...payloadFields } = payload;
  const unsigned = {
    schema: "goodle.signed-consumer-decision.v1" as const,
    ...payloadFields,
    signed_payload_hash,
    signature_base64,
  };
  const signed_decision_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    signed_decision_id: `signed-consumer-decision-${signed_decision_hash.slice(0, 16)}`,
    signed_decision_hash,
  };
}

export function verifySignedConsumerDecision(input: {
  signed: SignedConsumerDecisionV1;
  receipt: ConsumerDecisionReceiptV1;
  key: ConsumerAuthorityKeyV1;
  registry: ConsumerAuthorityRegistryV1;
}): boolean {
  if (!verifyConsumerDecisionReceipt(input.receipt)) return false;
  if (!verifyRegistry(input.registry)) return false;
  if (
    input.signed.authority_registry_snapshot_hash !==
    registrySnapshotHash(
      input.registry,
      input.signed.authority_registry_sequence,
    )
  ) return false;
  if (stateAt(input.registry, input.key, input.signed.authority_registry_sequence) !== "ACTIVE") return false;

  const payload = {
    schema: "goodle.signed-consumer-decision-payload.v1" as const,
    decision_receipt_id: input.receipt.receipt_id,
    decision_receipt_hash: input.receipt.receipt_hash,
    consumer_id: input.receipt.consumer_id,
    proof_id: input.receipt.proof_id,
    package_id: input.receipt.package_id,
    decision: input.receipt.decision,
    key_id: input.key.key_id,
    authority_registry_snapshot_hash: registrySnapshotHash(
      input.registry,
      input.signed.authority_registry_sequence,
    ),
    authority_registry_sequence: input.signed.authority_registry_sequence,
    public_key_fingerprint_sha256: input.key.public_key_fingerprint_sha256,
  };
  const expectedPayloadHash = sha256Json(payload);

  if (
    input.signed.signed_payload_hash !== expectedPayloadHash ||
    input.signed.consumer_id !== input.receipt.consumer_id ||
    input.signed.key_id !== input.key.key_id
  ) return false;

  const signatureValid = verify(
    null,
    Buffer.from(expectedPayloadHash, "utf8"),
    input.key.public_key_pem,
    Buffer.from(input.signed.signature_base64, "base64"),
  );
  if (!signatureValid) return false;

  const { signed_decision_id: _id, signed_decision_hash, ...unsigned } = input.signed;
  return sha256Json(unsigned) === signed_decision_hash;
}

export { verifyRegistry as verifyConsumerAuthorityRegistry };
