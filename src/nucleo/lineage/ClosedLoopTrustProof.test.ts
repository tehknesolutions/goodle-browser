import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import {
  appendRuntimeExecutionReceipt,
  completeRuntimeExecution,
  createRuntimeExecutionChronicle,
  startRuntimeExecution,
} from "./RuntimeExecutionChronicle";
import {
  createExecutionOutcomeAttestation,
} from "./ExecutionOutcomeAttestation";
import {
  createClosedLoopTrustProof,
  verifyClosedLoopTrustProof,
} from "./ClosedLoopTrustProof";

function baseProof(): UnifiedTrustProofV1 {
  const unsigned = {
    schema: "goodle.unified-trust-proof.v1" as const,
    build_id: "build-1",
    logical_build_id: "rbi-1",
    bundle_id: "bundle-1",
    release_id: undefined,
    governance_snapshot_id: "snapshot-1",
    build_ledger_hash: "ledger-1",
    attestation_hash: "attest-1",
    bundle_hash: "bundle-hash-1",
    release_hash: undefined,
    governance_snapshot_hash: "snapshot-hash-1",
    governance_ledger_hash: "gov-ledger-1",
    governance_ledger_head_hash: "gov-head-1",
  };
  const proof_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    proof_id: "trust-proof-1",
    proof_hash,
  };
}

function admission(): ExecutionAdmissionReceiptV1 {
  const unsigned = {
    schema: "goodle.execution-admission-receipt.v1" as const,
    proof_id: "trust-proof-1",
    bundle_id: "bundle-1",
    runtime_environment: "runtime",
    capability_request_id: "cap-1",
    matched_grant_ids: ["grant-1"],
    intake_disposition: "ACCEPTED" as const,
    quarantine_release_receipt_id: undefined,
    decision: "ADMITTED" as const,
    executable: true,
    reasons: [],
  };

  return {
    ...unsigned,
    receipt_id: "admission-1",
    receipt_hash: sha256Json(unsigned),
  };
}

const runtime_ref = {
  canonical_id: "runtime-1",
  actor_type: "service" as const,
};

function execution() {
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

  let execution_chronicle = createRuntimeExecutionChronicle();
  execution_chronicle = appendRuntimeExecutionReceipt(
    execution_chronicle,
    start,
  );
  execution_chronicle = appendRuntimeExecutionReceipt(
    execution_chronicle,
    done,
  );

  const outcome_attestation = createExecutionOutcomeAttestation({
    proof: baseProof(),
    admission: admission(),
    terminal_receipt: done,
    execution_chronicle,
  });

  return {
    terminal_receipt: done,
    execution_chronicle,
    outcome_attestation,
  };
}

describe("M39 Closed-Loop Trust Proof", () => {
  it("closes the trust chain from build proof to runtime outcome", () => {
    const e = execution();

    const proof = createClosedLoopTrustProof({
      base_proof: baseProof(),
      admission: admission(),
      ...e,
    });

    const verification = verifyClosedLoopTrustProof({
      proof,
      base_proof: baseProof(),
      admission: admission(),
      ...e,
    });

    expect(proof).toMatchObject({
      schema: "goodle.closed-loop-trust-proof.v1",
      build_id: "build-1",
      logical_build_id: "rbi-1",
      bundle_id: "bundle-1",
      execution_id: "exec-1",
      outcome: "SUCCEEDED",
      result_ref: "result://exec-1",
    });
    expect(verification.valid).toBe(true);
    expect(verification.reasons).toEqual([]);
  });

  it("detects a detached execution outcome attestation", () => {
    const e = execution();
    const proof = createClosedLoopTrustProof({
      base_proof: baseProof(),
      admission: admission(),
      ...e,
    });

    const detachedAttestation = {
      ...e.outcome_attestation,
      execution_id: "exec-other",
    };

    const verification = verifyClosedLoopTrustProof({
      proof,
      base_proof: baseProof(),
      admission: admission(),
      terminal_receipt: e.terminal_receipt,
      execution_chronicle: e.execution_chronicle,
      outcome_attestation: detachedAttestation,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain(
      "EXECUTION_OUTCOME_IDENTITY_LINKS_INVALID",
    );
  });

  it("detects closed-loop proof tampering", () => {
    const e = execution();
    const proof = createClosedLoopTrustProof({
      base_proof: baseProof(),
      admission: admission(),
      ...e,
    });

    const verification = verifyClosedLoopTrustProof({
      proof: { ...proof, runtime_environment: "other-runtime" },
      base_proof: baseProof(),
      admission: admission(),
      ...e,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain(
      "CLOSED_LOOP_IDENTITY_LINKS_INVALID",
    );
    expect(verification.reasons).toContain("CLOSED_LOOP_HASH_INVALID");
  });
});
