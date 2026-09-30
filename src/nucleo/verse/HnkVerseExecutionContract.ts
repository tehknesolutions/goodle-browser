import type { IdentityRef } from "../contratos/HnkEcosystemContracts";
import type { HnkVersePlan, VerseOperation } from "./HnkVerseAdapter";

export type VerseExecutionStatus = "planned" | "accepted" | "rejected" | "executed" | "failed";

export type VerseExecutionRequest = {
  request_id: string;
  principal: IdentityRef;
  runtime: IdentityRef;
  plan: HnkVersePlan;
  intent_ref?: string;
  project_ref?: string;
  requested_at: string;
};

export type VerseExecutionReceipt = {
  request_id: string;
  runtime: IdentityRef;
  status: VerseExecutionStatus;
  accepted_operations: string[];
  rejected_operations: Array<{ operation_id: string; reason: string }>;
  executed_at?: string;
};

const ORDER: Record<VerseOperation["operation"], number> = {
  world: 0,
  entity: 1,
  property: 2,
  event: 3,
  action: 4,
};

export function orderVerseOperations(plan: HnkVersePlan): VerseOperation[] {
  return [...plan.operations].sort((a, b) => ORDER[a.operation] - ORDER[b.operation]);
}

export function validateVerseExecutionRequest(request: VerseExecutionRequest): string[] {
  const errors: string[] = [];
  if (!request.request_id) errors.push("missing request_id");
  if (!request.principal.canonical_id) errors.push("missing principal");
  if (!request.runtime.canonical_id) errors.push("missing runtime");
  if (request.plan.unresolved.length > 0) errors.push("plan contains unresolved semantics");
  if (request.plan.operations.length === 0) errors.push("plan contains no executable operations");
  return errors;
}

export function createVerseExecutionReceipt(request: VerseExecutionRequest): VerseExecutionReceipt {
  const errors = validateVerseExecutionRequest(request);
  if (errors.length > 0) {
    return {
      request_id: request.request_id,
      runtime: request.runtime,
      status: "rejected",
      accepted_operations: [],
      rejected_operations: request.plan.operations.map((operation) => ({
        operation_id: operation.operation_id,
        reason: errors.join("; "),
      })),
    };
  }
  return {
    request_id: request.request_id,
    runtime: request.runtime,
    status: "accepted",
    accepted_operations: orderVerseOperations(request.plan).map((operation) => operation.operation_id),
    rejected_operations: [],
  };
}
