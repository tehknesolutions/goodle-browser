import type { GoodleIRNode } from "../ir/GoodleIR";
import type { ManifestationTarget } from "../manifestacao/ManifestationGraph";
import {
  executeManifestationTarget,
  type TargetExecutionResult,
} from "../manifestacao/TargetExecutionRouter";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "../manifestacao/executores/BuiltInRuntimeExecutors";
import type { IdentityRef } from "../contratos/HnkEcosystemContracts";
import type { UnifiedTrustProofV1 } from "./UnifiedTrustProof";
import type { ExecutionAdmissionReceiptV1 } from "./ExecutionAdmissionGate";
import {
  startRuntimeExecution,
  completeRuntimeExecution,
  failRuntimeExecution,
  createRuntimeExecutionChronicle,
  appendRuntimeExecutionReceipt,
  type RuntimeExecutionChronicleV1,
  type RuntimeExecutionReceiptV1,
} from "./RuntimeExecutionChronicle";
import {
  createExecutionOutcomeAttestation,
  type ExecutionOutcomeAttestationV1,
} from "./ExecutionOutcomeAttestation";
import {
  createClosedLoopTrustProof,
  type ClosedLoopTrustProofV1,
} from "./ClosedLoopTrustProof";

export type ConcreteRuntimeIntegrationResultV1 = {
  schema: "goodle.concrete-runtime-integration-result.v1";
  target_execution: TargetExecutionResult;
  started_receipt: RuntimeExecutionReceiptV1;
  terminal_receipt: RuntimeExecutionReceiptV1;
  execution_chronicle: RuntimeExecutionChronicleV1;
  outcome_attestation: ExecutionOutcomeAttestationV1;
  closed_loop_proof: ClosedLoopTrustProofV1;
};

function resultReference(result: TargetExecutionResult): string {
  if (
    result.output &&
    typeof result.output === "object" &&
    "entry" in result.output &&
    typeof (result.output as { entry?: unknown }).entry === "string"
  ) {
    return `artifact://${result.adapter}@${result.version}/${(result.output as { entry: string }).entry}`;
  }

  return `execution://${result.execution_id}`;
}

export function executeAdmittedManifestationTarget(input: {
  base_proof: UnifiedTrustProofV1;
  admission: ExecutionAdmissionReceiptV1;
  target: ManifestationTarget;
  source: GoodleIRNode;
  runtime_ref: IdentityRef;
}): ConcreteRuntimeIntegrationResultV1 {
  const started_receipt = startRuntimeExecution({
    admission: input.admission,
    execution_id: `runtime-${input.target.target_id}`,
    runtime_ref: input.runtime_ref,
  });

  let execution_chronicle = appendRuntimeExecutionReceipt(
    createRuntimeExecutionChronicle(),
    started_receipt,
  );

  const target_execution = executeManifestationTarget(
    input.target,
    input.source,
    GOODLE_RUNTIME_EXECUTORS_V1,
  );

  const terminal_receipt =
    target_execution.status === "EXECUTED"
      ? completeRuntimeExecution({
          admission: input.admission,
          execution_id: started_receipt.execution_id,
          runtime_ref: input.runtime_ref,
          result_ref: resultReference(target_execution),
        })
      : failRuntimeExecution({
          admission: input.admission,
          execution_id: started_receipt.execution_id,
          runtime_ref: input.runtime_ref,
          error_code: target_execution.error
            ? `${target_execution.status}:${target_execution.error}`
            : target_execution.status,
        });

  execution_chronicle = appendRuntimeExecutionReceipt(
    execution_chronicle,
    terminal_receipt,
  );

  const outcome_attestation = createExecutionOutcomeAttestation({
    proof: input.base_proof,
    admission: input.admission,
    terminal_receipt,
    execution_chronicle,
  });

  const closed_loop_proof = createClosedLoopTrustProof({
    base_proof: input.base_proof,
    admission: input.admission,
    terminal_receipt,
    execution_chronicle,
    outcome_attestation,
  });

  return {
    schema: "goodle.concrete-runtime-integration-result.v1",
    target_execution,
    started_receipt,
    terminal_receipt,
    execution_chronicle,
    outcome_attestation,
    closed_loop_proof,
  };
}
