import { describe, expect, it } from "vitest";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import { sha256Json } from "./BuildLedger";
import {
  appendRuntimeExecutionReceipt,
  completeRuntimeExecution,
  createRuntimeExecutionChronicle,
  failRuntimeExecution,
  startRuntimeExecution,
  verifyRuntimeExecutionChronicle,
  verifyRuntimeExecutionReceipt,
} from "./RuntimeExecutionChronicle";

function admission(): ExecutionAdmissionReceiptV1 {
  const unsigned = {
    schema: "goodle.execution-admission-receipt.v1" as const,
    proof_id: "proof-1",
    bundle_id: "bundle-1",
    runtime_environment: "runtime",
    capability_request_id: "cap-request-1",
    matched_grant_ids: ["grant-1"],
    intake_disposition: "ACCEPTED" as const,
    quarantine_release_receipt_id: undefined,
    decision: "ADMITTED" as const,
    executable: true,
    reasons: [],
  };

  return {
    ...unsigned,
    receipt_id: "execution-admission-1",
    receipt_hash: sha256Json(unsigned),
  };
}

const runtimeRef = {
  canonical_id: "runtime-1",
  actor_type: "service" as const,
};

describe("M37 Runtime Execution Receipt / Chronicle", () => {
  it("records actual start and successful completion after admission", () => {
    const start = startRuntimeExecution({
      admission: admission(),
      execution_id: "exec-1",
      runtime_ref: runtimeRef,
    });

    const done = completeRuntimeExecution({
      admission: admission(),
      execution_id: "exec-1",
      runtime_ref: runtimeRef,
      result_ref: "result://exec-1",
    });

    let chronicle = createRuntimeExecutionChronicle();
    chronicle = appendRuntimeExecutionReceipt(chronicle, start);
    chronicle = appendRuntimeExecutionReceipt(chronicle, done);

    expect(start.status).toBe("STARTED");
    expect(done.status).toBe("SUCCEEDED");
    expect(verifyRuntimeExecutionReceipt(done)).toBe(true);
    expect(verifyRuntimeExecutionChronicle(chronicle)).toBe(true);
    expect(chronicle.entries.map((entry) => entry.status)).toEqual([
      "STARTED",
      "SUCCEEDED",
    ]);
  });

  it("records runtime failure distinctly from admission", () => {
    const start = startRuntimeExecution({
      admission: admission(),
      execution_id: "exec-2",
      runtime_ref: runtimeRef,
    });

    const failed = failRuntimeExecution({
      admission: admission(),
      execution_id: "exec-2",
      runtime_ref: runtimeRef,
      error_code: "RUNTIME_CRASH",
    });

    let chronicle = createRuntimeExecutionChronicle();
    chronicle = appendRuntimeExecutionReceipt(chronicle, start);
    chronicle = appendRuntimeExecutionReceipt(chronicle, failed);

    expect(failed).toMatchObject({
      status: "FAILED",
      error_code: "RUNTIME_CRASH",
      admission_receipt_id: "execution-admission-1",
    });
    expect(verifyRuntimeExecutionChronicle(chronicle)).toBe(true);
  });

  it("refuses runtime execution from a blocked admission", () => {
    const admitted = admission();
    const blockedUnsigned = {
      ...admitted,
      decision: "BLOCKED" as const,
      executable: false,
      reasons: ["CAPABILITY_NOT_AUTHORIZED"],
    };
    const {
      receipt_id,
      receipt_hash: _oldHash,
      ...unsigned
    } = blockedUnsigned;
    const blocked = {
      ...unsigned,
      receipt_id,
      receipt_hash: sha256Json(unsigned),
    };

    expect(() =>
      startRuntimeExecution({
        admission: blocked,
        execution_id: "exec-blocked",
        runtime_ref: runtimeRef,
      }),
    ).toThrow("EXECUTION_NOT_ADMITTED");
  });

  it("requires STARTED before a terminal runtime receipt enters the chronicle", () => {
    const done = completeRuntimeExecution({
      admission: admission(),
      execution_id: "exec-3",
      runtime_ref: runtimeRef,
      result_ref: "result://exec-3",
    });

    expect(() =>
      appendRuntimeExecutionReceipt(
        createRuntimeExecutionChronicle(),
        done,
      ),
    ).toThrow("RUNTIME_EXECUTION_MUST_START_FIRST");
  });

  it("prevents a second terminal event for the same execution", () => {
    const start = startRuntimeExecution({
      admission: admission(),
      execution_id: "exec-4",
      runtime_ref: runtimeRef,
    });
    const done = completeRuntimeExecution({
      admission: admission(),
      execution_id: "exec-4",
      runtime_ref: runtimeRef,
      result_ref: "result://exec-4",
    });
    const failed = failRuntimeExecution({
      admission: admission(),
      execution_id: "exec-4",
      runtime_ref: runtimeRef,
      error_code: "LATE_FAILURE",
    });

    let chronicle = createRuntimeExecutionChronicle();
    chronicle = appendRuntimeExecutionReceipt(chronicle, start);
    chronicle = appendRuntimeExecutionReceipt(chronicle, done);

    expect(() =>
      appendRuntimeExecutionReceipt(chronicle, failed),
    ).toThrow("RUNTIME_EXECUTION_ALREADY_TERMINAL");
  });
});
