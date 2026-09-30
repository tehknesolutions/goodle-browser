import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import {
  appendRuntimeExecutionReceipt,
  completeRuntimeExecution,
  createRuntimeExecutionChronicle,
  failRuntimeExecution,
  startRuntimeExecution,
} from "./RuntimeExecutionChronicle";
import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import {
  createExecutionOutcomeAttestation,
  verifyExecutionOutcomeAttestation,
} from "./ExecutionOutcomeAttestation";

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

function proof(): UnifiedTrustProofV1 {
  return {
    schema: "goodle.unified-trust-proof.v1",
    proof_id: "proof-1",
    build_id: "build-1",
    logical_build_id: "rbi-1",
    bundle_id: "bundle-1",
    governance_snapshot_id: "snapshot-1",
    build_ledger_hash: "build-ledger",
    attestation_hash: "attestation",
    bundle_hash: "bundle-hash",
    governance_snapshot_hash: "snapshot-hash",
    governance_ledger_hash: "governance-ledger",
    proof_hash: "proof-hash",
  };
}

const runtime_ref = {
  canonical_id: "runtime-1",
  actor_type: "service" as const,
};

function successfulExecution() {
  const start = startRuntimeExecution({
    admission: admission(),
    execution_id: "exec-1",
    runtime_ref,
  });

  const done = completeRuntimeExecution({
    admission: admission(),
    execution_id: "exec-1",
    runtime_ref,
    result_ref: "result://exec-1",
  });

  let chronicle = createRuntimeExecutionChronicle();
  chronicle = appendRuntimeExecutionReceipt(chronicle, start);
  chronicle = appendRuntimeExecutionReceipt(chronicle, done);

  return { done, chronicle };
}

describe("M38 Execution Outcome Attestation", () => {
  it("attests a successful runtime outcome back to the trust chain", () => {
    const { done, chronicle } = successfulExecution();

    const attestation = createExecutionOutcomeAttestation({
      proof: proof(),
      admission: admission(),
      terminal_receipt: done,
      execution_chronicle: chronicle,
    });

    const verification = verifyExecutionOutcomeAttestation({
      attestation,
      proof: proof(),
      admission: admission(),
      terminal_receipt: done,
      execution_chronicle: chronicle,
    });

    expect(attestation).toMatchObject({
      outcome: "SUCCEEDED",
      result_ref: "result://exec-1",
      proof_id: "proof-1",
      bundle_id: "bundle-1",
      admission_receipt_id: "execution-admission-1",
    });
    expect(verification.valid).toBe(true);
    expect(verification.reasons).toEqual([]);
  });

  it("attests a failed runtime outcome with its error code", () => {
    const start = startRuntimeExecution({
      admission: admission(),
      execution_id: "exec-fail",
      runtime_ref,
    });

    const failed = failRuntimeExecution({
      admission: admission(),
      execution_id: "exec-fail",
      runtime_ref,
      error_code: "RUNTIME_CRASH",
    });

    let chronicle = createRuntimeExecutionChronicle();
    chronicle = appendRuntimeExecutionReceipt(chronicle, start);
    chronicle = appendRuntimeExecutionReceipt(chronicle, failed);

    const attestation = createExecutionOutcomeAttestation({
      proof: proof(),
      admission: admission(),
      terminal_receipt: failed,
      execution_chronicle: chronicle,
    });

    expect(attestation).toMatchObject({
      outcome: "FAILED",
      error_code: "RUNTIME_CRASH",
    });
  });

  it("refuses STARTED as an outcome", () => {
    const start = startRuntimeExecution({
      admission: admission(),
      execution_id: "exec-started",
      runtime_ref,
    });

    let chronicle = createRuntimeExecutionChronicle();
    chronicle = appendRuntimeExecutionReceipt(chronicle, start);

    expect(() =>
      createExecutionOutcomeAttestation({
        proof: proof(),
        admission: admission(),
        terminal_receipt: start,
        execution_chronicle: chronicle,
      }),
    ).toThrow("EXECUTION_OUTCOME_REQUIRES_TERMINAL_RECEIPT");
  });

  it("detects a terminal receipt detached from the chronicle", () => {
    const { done, chronicle } = successfulExecution();

    const attestation = createExecutionOutcomeAttestation({
      proof: proof(),
      admission: admission(),
      terminal_receipt: done,
      execution_chronicle: chronicle,
    });

    const detachedChronicle = {
      ...chronicle,
      entries: chronicle.entries.filter(
        (entry) => entry.status !== "SUCCEEDED",
      ),
    };

    const verification = verifyExecutionOutcomeAttestation({
      attestation,
      proof: proof(),
      admission: admission(),
      terminal_receipt: done,
      execution_chronicle: detachedChronicle,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("EXECUTION_CHRONICLE_INVALID");
    expect(verification.reasons).toContain(
      "EXECUTION_OUTCOME_IDENTITY_LINKS_INVALID",
    );
  });
});
