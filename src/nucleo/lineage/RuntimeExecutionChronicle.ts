import type { IdentityRef } from "../contratos/HnkEcosystemContracts";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import {
  assertExecutionAdmitted,
  verifyExecutionAdmissionReceipt,
} from "./ExecutionAdmissionGate";
import { sha256Json } from "./BuildLedger";

export type RuntimeExecutionStatus =
  | "STARTED"
  | "SUCCEEDED"
  | "FAILED";

export type RuntimeExecutionReceiptV1 = {
  schema: "goodle.runtime-execution-receipt.v1";
  receipt_id: string;
  execution_id: string;
  admission_receipt_id: string;
  admission_receipt_hash: string;
  proof_id: string;
  bundle_id: string;
  runtime_environment: string;
  runtime_ref: IdentityRef;
  status: RuntimeExecutionStatus;
  result_ref?: string;
  error_code?: string;
  receipt_hash: string;
};

export type RuntimeExecutionChronicleEntryV1 = {
  schema: "goodle.runtime-execution-chronicle-entry.v1";
  entry_id: string;
  sequence: number;
  execution_id: string;
  status: RuntimeExecutionStatus;
  receipt_id: string;
  receipt_hash: string;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type RuntimeExecutionChronicleV1 = {
  schema: "goodle.runtime-execution-chronicle.v1";
  entries: RuntimeExecutionChronicleEntryV1[];
  head_hash?: string;
  chronicle_hash: string;
};

function chronicleHash(
  entries: RuntimeExecutionChronicleEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.runtime-execution-chronicle.v1",
    entries,
    head_hash,
  });
}

export function createRuntimeExecutionChronicle(): RuntimeExecutionChronicleV1 {
  const entries: RuntimeExecutionChronicleEntryV1[] = [];
  return {
    schema: "goodle.runtime-execution-chronicle.v1",
    entries,
    head_hash: undefined,
    chronicle_hash: chronicleHash(entries, undefined),
  };
}

function createRuntimeExecutionReceipt(input: {
  admission: ExecutionAdmissionReceiptV1;
  execution_id: string;
  runtime_ref: IdentityRef;
  status: RuntimeExecutionStatus;
  result_ref?: string;
  error_code?: string;
}): RuntimeExecutionReceiptV1 {
  if (!verifyExecutionAdmissionReceipt(input.admission)) {
    throw new Error("RUNTIME_EXECUTION_ADMISSION_RECEIPT_INVALID");
  }
  assertExecutionAdmitted(input.admission);

  if (!input.execution_id.trim()) {
    throw new Error("RUNTIME_EXECUTION_ID_REQUIRED");
  }

  if (input.status === "SUCCEEDED" && !input.result_ref?.trim()) {
    throw new Error("RUNTIME_EXECUTION_RESULT_REF_REQUIRED");
  }

  if (input.status === "FAILED" && !input.error_code?.trim()) {
    throw new Error("RUNTIME_EXECUTION_ERROR_CODE_REQUIRED");
  }

  const unsigned = {
    schema: "goodle.runtime-execution-receipt.v1" as const,
    execution_id: input.execution_id,
    admission_receipt_id: input.admission.receipt_id,
    admission_receipt_hash: input.admission.receipt_hash,
    proof_id: input.admission.proof_id,
    bundle_id: input.admission.bundle_id,
    runtime_environment: input.admission.runtime_environment,
    runtime_ref: { ...input.runtime_ref },
    status: input.status,
    result_ref: input.result_ref,
    error_code: input.error_code,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `runtime-execution-${input.status.toLowerCase()}-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function startRuntimeExecution(input: {
  admission: ExecutionAdmissionReceiptV1;
  execution_id: string;
  runtime_ref: IdentityRef;
}): RuntimeExecutionReceiptV1 {
  return createRuntimeExecutionReceipt({
    ...input,
    status: "STARTED",
  });
}

export function completeRuntimeExecution(input: {
  admission: ExecutionAdmissionReceiptV1;
  execution_id: string;
  runtime_ref: IdentityRef;
  result_ref: string;
}): RuntimeExecutionReceiptV1 {
  return createRuntimeExecutionReceipt({
    ...input,
    status: "SUCCEEDED",
    result_ref: input.result_ref,
  });
}

export function failRuntimeExecution(input: {
  admission: ExecutionAdmissionReceiptV1;
  execution_id: string;
  runtime_ref: IdentityRef;
  error_code: string;
}): RuntimeExecutionReceiptV1 {
  return createRuntimeExecutionReceipt({
    ...input,
    status: "FAILED",
    error_code: input.error_code,
  });
}

export function verifyRuntimeExecutionReceipt(
  receipt: RuntimeExecutionReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === receipt_hash;
}

export function appendRuntimeExecutionReceipt(
  chronicle: RuntimeExecutionChronicleV1,
  receipt: RuntimeExecutionReceiptV1,
): RuntimeExecutionChronicleV1 {
  if (!verifyRuntimeExecutionChronicle(chronicle)) {
    throw new Error("RUNTIME_EXECUTION_CHRONICLE_INTEGRITY_FAILED");
  }
  if (!verifyRuntimeExecutionReceipt(receipt)) {
    throw new Error("RUNTIME_EXECUTION_RECEIPT_INVALID");
  }

  const sameExecution = chronicle.entries.filter(
    (entry) => entry.execution_id === receipt.execution_id,
  );

  if (
    sameExecution.length === 0 &&
    receipt.status !== "STARTED"
  ) {
    throw new Error("RUNTIME_EXECUTION_MUST_START_FIRST");
  }

  const lastForExecution = sameExecution.at(-1);

  if (
    lastForExecution?.status === "SUCCEEDED" ||
    lastForExecution?.status === "FAILED"
  ) {
    throw new Error("RUNTIME_EXECUTION_ALREADY_TERMINAL");
  }

  if (
    lastForExecution?.status === "STARTED" &&
    receipt.status === "STARTED"
  ) {
    throw new Error("RUNTIME_EXECUTION_ALREADY_STARTED");
  }

  const unsigned = {
    schema: "goodle.runtime-execution-chronicle-entry.v1" as const,
    sequence: chronicle.entries.length + 1,
    execution_id: receipt.execution_id,
    status: receipt.status,
    receipt_id: receipt.receipt_id,
    receipt_hash: receipt.receipt_hash,
    previous_entry_hash: chronicle.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: RuntimeExecutionChronicleEntryV1 = {
    ...unsigned,
    entry_id: `runtime-entry-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
    entry_hash,
  };

  const entries = [...chronicle.entries, entry];

  return {
    schema: chronicle.schema,
    entries,
    head_hash: entry_hash,
    chronicle_hash: chronicleHash(entries, entry_hash),
  };
}

export function verifyRuntimeExecutionChronicle(
  chronicle: RuntimeExecutionChronicleV1,
): boolean {
  let previous: string | undefined;
  const state = new Map<string, RuntimeExecutionStatus>();

  for (let index = 0; index < chronicle.entries.length; index += 1) {
    const entry = chronicle.entries[index];
    if (!entry) return false;
    if (entry.sequence !== index + 1) return false;
    if (entry.previous_entry_hash !== previous) return false;

    const {
      entry_id: _entryId,
      entry_hash,
      ...unsigned
    } = entry;

    if (sha256Json(unsigned) !== entry_hash) return false;

    const prior = state.get(entry.execution_id);

    if (!prior && entry.status !== "STARTED") return false;
    if (prior === "STARTED" && entry.status === "STARTED") return false;
    if (
      prior === "SUCCEEDED" ||
      prior === "FAILED"
    ) return false;

    state.set(entry.execution_id, entry.status);
    previous = entry_hash;
  }

  const expectedHead = chronicle.entries.at(-1)?.entry_hash;
  if (chronicle.head_hash !== expectedHead) return false;

  return (
    chronicle.chronicle_hash ===
    chronicleHash(chronicle.entries, chronicle.head_hash)
  );
}
