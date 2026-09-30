import type { TrustedAuditorKeyV1 } from "./SignedExternalTrustAnchor";
import { sha256Json } from "./BuildLedger";

export type AuditorKeyLifecycleAction =
  | "REGISTER"
  | "ROTATE"
  | "REVOKE";

export type AuditorKeyLifecycleStatus =
  | "ACTIVE"
  | "ROTATED"
  | "REVOKED";

export type TrustedAuditorKeyRegistryEntryV1 = {
  schema: "goodle.trusted-auditor-key-registry-entry.v1";
  entry_id: string;
  sequence: number;
  action: AuditorKeyLifecycleAction;
  auditor_id: string;
  key_id: string;
  key_fingerprint_sha256: string;
  previous_key_id?: string;
  reason_code?: string;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type TrustedAuditorKeyRegistryV1 = {
  schema: "goodle.trusted-auditor-key-registry.v1";
  entries: TrustedAuditorKeyRegistryEntryV1[];
  head_hash?: string;
  registry_hash: string;
};

export type AuditorKeyStateV1 = {
  schema: "goodle.auditor-key-state.v1";
  auditor_id: string;
  key_id: string;
  fingerprint_sha256: string;
  status: AuditorKeyLifecycleStatus;
  registered_at_sequence: number;
  terminal_at_sequence?: number;
  successor_key_id?: string;
  state_hash: string;
};

function registryHash(
  entries: TrustedAuditorKeyRegistryEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.trusted-auditor-key-registry.v1",
    entries,
    head_hash,
  });
}

export function createTrustedAuditorKeyRegistry(): TrustedAuditorKeyRegistryV1 {
  const entries: TrustedAuditorKeyRegistryEntryV1[] = [];
  return {
    schema: "goodle.trusted-auditor-key-registry.v1",
    entries,
    head_hash: undefined,
    registry_hash: registryHash(entries, undefined),
  };
}

function appendKeyEvent(
  registry: TrustedAuditorKeyRegistryV1,
  event: Omit<
    TrustedAuditorKeyRegistryEntryV1,
    "schema" | "entry_id" | "sequence" | "previous_entry_hash" | "entry_hash"
  >,
): TrustedAuditorKeyRegistryV1 {
  if (!verifyTrustedAuditorKeyRegistry(registry)) {
    throw new Error("AUDITOR_KEY_REGISTRY_INTEGRITY_FAILED");
  }

  const unsigned = {
    schema: "goodle.trusted-auditor-key-registry-entry.v1" as const,
    sequence: registry.entries.length + 1,
    ...event,
    previous_entry_hash: registry.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: TrustedAuditorKeyRegistryEntryV1 = {
    ...unsigned,
    entry_id: `auditor-key-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
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

export function registerTrustedAuditorKey(input: {
  registry: TrustedAuditorKeyRegistryV1;
  key: TrustedAuditorKeyV1;
}): TrustedAuditorKeyRegistryV1 {
  if (
    input.registry.entries.some(
      (entry) => entry.key_id === input.key.key_id,
    )
  ) {
    throw new Error("AUDITOR_KEY_ALREADY_REGISTERED");
  }

  const activeForAuditor = currentAuditorKeyState(
    input.registry,
    input.key.auditor_id,
  );

  if (activeForAuditor?.status === "ACTIVE") {
    throw new Error("AUDITOR_ACTIVE_KEY_ALREADY_EXISTS");
  }

  return appendKeyEvent(input.registry, {
    action: "REGISTER",
    auditor_id: input.key.auditor_id,
    key_id: input.key.key_id,
    key_fingerprint_sha256: input.key.public_key_fingerprint_sha256,
  });
}

export function rotateTrustedAuditorKey(input: {
  registry: TrustedAuditorKeyRegistryV1;
  current_key: TrustedAuditorKeyV1;
  next_key: TrustedAuditorKeyV1;
  reason_code: string;
}): TrustedAuditorKeyRegistryV1 {
  if (!input.reason_code.trim()) {
    throw new Error("AUDITOR_KEY_ROTATION_REASON_REQUIRED");
  }
  if (input.current_key.auditor_id !== input.next_key.auditor_id) {
    throw new Error("AUDITOR_KEY_ROTATION_AUDITOR_MISMATCH");
  }
  if (
    input.registry.entries.some(
      (entry) => entry.key_id === input.next_key.key_id,
    )
  ) {
    throw new Error("AUDITOR_KEY_ALREADY_REGISTERED");
  }

  const current = deriveAuditorKeyStateAtSequence(
    input.registry,
    input.current_key.key_id,
    input.registry.entries.length,
  );

  if (!current || current.status !== "ACTIVE") {
    throw new Error("AUDITOR_KEY_ROTATION_REQUIRES_ACTIVE_KEY");
  }

  let registry = appendKeyEvent(input.registry, {
    action: "ROTATE",
    auditor_id: input.current_key.auditor_id,
    key_id: input.current_key.key_id,
    key_fingerprint_sha256:
      input.current_key.public_key_fingerprint_sha256,
    previous_key_id: input.next_key.key_id,
    reason_code: input.reason_code,
  });

  registry = appendKeyEvent(registry, {
    action: "REGISTER",
    auditor_id: input.next_key.auditor_id,
    key_id: input.next_key.key_id,
    key_fingerprint_sha256:
      input.next_key.public_key_fingerprint_sha256,
    previous_key_id: input.current_key.key_id,
    reason_code: input.reason_code,
  });

  return registry;
}

export function revokeTrustedAuditorKey(input: {
  registry: TrustedAuditorKeyRegistryV1;
  key: TrustedAuditorKeyV1;
  reason_code: string;
}): TrustedAuditorKeyRegistryV1 {
  if (!input.reason_code.trim()) {
    throw new Error("AUDITOR_KEY_REVOCATION_REASON_REQUIRED");
  }

  const state = deriveAuditorKeyStateAtSequence(
    input.registry,
    input.key.key_id,
    input.registry.entries.length,
  );

  if (!state || state.status !== "ACTIVE") {
    throw new Error("AUDITOR_KEY_REVOCATION_REQUIRES_ACTIVE_KEY");
  }

  return appendKeyEvent(input.registry, {
    action: "REVOKE",
    auditor_id: input.key.auditor_id,
    key_id: input.key.key_id,
    key_fingerprint_sha256: input.key.public_key_fingerprint_sha256,
    reason_code: input.reason_code,
  });
}

export function verifyTrustedAuditorKeyRegistry(
  registry: TrustedAuditorKeyRegistryV1,
): boolean {
  let previous: string | undefined;

  for (let index = 0; index < registry.entries.length; index += 1) {
    const entry = registry.entries[index];
    if (!entry) return false;
    if (entry.sequence !== index + 1) return false;
    if (entry.previous_entry_hash !== previous) return false;

    const { entry_id: _entryId, entry_hash, ...unsigned } = entry;
    if (sha256Json(unsigned) !== entry_hash) return false;

    previous = entry_hash;
  }

  const expectedHead = registry.entries.at(-1)?.entry_hash;
  if (registry.head_hash !== expectedHead) return false;

  return (
    registry.registry_hash ===
    registryHash(registry.entries, registry.head_hash)
  );
}

export function deriveAuditorKeyStateAtSequence(
  registry: TrustedAuditorKeyRegistryV1,
  key_id: string,
  sequence: number,
): AuditorKeyStateV1 | undefined {
  if (!verifyTrustedAuditorKeyRegistry(registry)) {
    throw new Error("AUDITOR_KEY_REGISTRY_INTEGRITY_FAILED");
  }

  const relevant = registry.entries.filter(
    (entry) => entry.key_id === key_id && entry.sequence <= sequence,
  );

  const registration = relevant.find(
    (entry) => entry.action === "REGISTER",
  );
  if (!registration) return undefined;

  const terminal = relevant.find(
    (entry) =>
      entry.action === "ROTATE" || entry.action === "REVOKE",
  );

  const status: AuditorKeyLifecycleStatus =
    terminal?.action === "ROTATE"
      ? "ROTATED"
      : terminal?.action === "REVOKE"
        ? "REVOKED"
        : "ACTIVE";

  const unsigned = {
    schema: "goodle.auditor-key-state.v1" as const,
    auditor_id: registration.auditor_id,
    key_id: registration.key_id,
    fingerprint_sha256: registration.key_fingerprint_sha256,
    status,
    registered_at_sequence: registration.sequence,
    terminal_at_sequence: terminal?.sequence,
    successor_key_id:
      terminal?.action === "ROTATE"
        ? terminal.previous_key_id
        : undefined,
  };

  return {
    ...unsigned,
    state_hash: sha256Json(unsigned),
  };
}

export function currentAuditorKeyState(
  registry: TrustedAuditorKeyRegistryV1,
  auditor_id: string,
): AuditorKeyStateV1 | undefined {
  if (!verifyTrustedAuditorKeyRegistry(registry)) {
    throw new Error("AUDITOR_KEY_REGISTRY_INTEGRITY_FAILED");
  }

  const registered = registry.entries
    .filter(
      (entry) =>
        entry.auditor_id === auditor_id &&
        entry.action === "REGISTER",
    )
    .map((entry) =>
      deriveAuditorKeyStateAtSequence(
        registry,
        entry.key_id,
        registry.entries.length,
      ),
    )
    .filter(
      (state): state is AuditorKeyStateV1 => Boolean(state),
    );

  return [...registered]
    .reverse()
    .find((state) => state.status === "ACTIVE");
}

export function keyWasTrustedAtSequence(input: {
  registry: TrustedAuditorKeyRegistryV1;
  key: TrustedAuditorKeyV1;
  sequence: number;
}): boolean {
  const state = deriveAuditorKeyStateAtSequence(
    input.registry,
    input.key.key_id,
    input.sequence,
  );

  return Boolean(
    state &&
      state.auditor_id === input.key.auditor_id &&
      state.fingerprint_sha256 ===
        input.key.public_key_fingerprint_sha256 &&
      state.status === "ACTIVE",
  );
}
