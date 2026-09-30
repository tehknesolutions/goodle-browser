import type { TrustedDeploymentReceiptV1 } from "./TrustedDeploymentGate";
import {
  assertTrustedDeploymentAuthorized,
  verifyTrustedDeploymentReceipt,
} from "./TrustedDeploymentGate";
import { sha256Json } from "./BuildLedger";

export type DeploymentChronicleEventType = "ACTIVATE" | "ROLLBACK";

export type DeploymentChronicleEventV1 = {
  schema: "goodle.deployment-chronicle-event.v1";
  event_id: string;
  environment: string;
  type: DeploymentChronicleEventType;
  receipt_id: string;
  bundle_id: string;
  logical_build_id: string;
  previous_event_hash?: string;
  rollback_from_receipt_id?: string;
  event_hash: string;
};

export type EnvironmentStateV1 = {
  schema: "goodle.environment-state.v1";
  environment: string;
  active_receipt_id?: string;
  active_bundle_id?: string;
  active_logical_build_id?: string;
  head_event_hash?: string;
  revision: number;
  history: DeploymentChronicleEventV1[];
};

export function createEnvironmentState(environment: string): EnvironmentStateV1 {
  if (!environment.trim()) throw new Error("ENVIRONMENT_REQUIRED");

  return {
    schema: "goodle.environment-state.v1",
    environment,
    revision: 0,
    history: [],
  };
}

function createEvent(input: {
  state: EnvironmentStateV1;
  receipt: TrustedDeploymentReceiptV1;
  type: DeploymentChronicleEventType;
  rollback_from_receipt_id?: string;
}): DeploymentChronicleEventV1 {
  const unsigned = {
    schema: "goodle.deployment-chronicle-event.v1" as const,
    environment: input.state.environment,
    type: input.type,
    receipt_id: input.receipt.receipt_id,
    bundle_id: input.receipt.bundle_id,
    logical_build_id: input.receipt.logical_build_id,
    previous_event_hash: input.state.head_event_hash,
    rollback_from_receipt_id: input.rollback_from_receipt_id,
  };

  const event_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    event_id: `deploy-event-${event_hash.slice(0, 16)}`,
    event_hash,
  };
}

export function activateDeployment(
  state: EnvironmentStateV1,
  receipt: TrustedDeploymentReceiptV1,
): EnvironmentStateV1 {
  if (!verifyTrustedDeploymentReceipt(receipt)) {
    throw new Error("DEPLOYMENT_RECEIPT_INTEGRITY_FAILED");
  }
  assertTrustedDeploymentAuthorized(receipt);

  if (receipt.action !== "DEPLOY") {
    throw new Error(`DEPLOYMENT_ACTION_NOT_ACTIVATABLE: ${receipt.action}`);
  }
  if (receipt.environment !== state.environment) {
    throw new Error(
      `DEPLOYMENT_ENVIRONMENT_MISMATCH: ${receipt.environment} != ${state.environment}`,
    );
  }

  const event = createEvent({ state, receipt, type: "ACTIVATE" });

  return {
    ...state,
    active_receipt_id: receipt.receipt_id,
    active_bundle_id: receipt.bundle_id,
    active_logical_build_id: receipt.logical_build_id,
    head_event_hash: event.event_hash,
    revision: state.revision + 1,
    history: [...state.history, event],
  };
}

export function rollbackDeployment(
  state: EnvironmentStateV1,
  targetReceipt: TrustedDeploymentReceiptV1,
): EnvironmentStateV1 {
  if (!state.active_receipt_id) {
    throw new Error("ROLLBACK_NO_ACTIVE_DEPLOYMENT");
  }
  if (!verifyTrustedDeploymentReceipt(targetReceipt)) {
    throw new Error("ROLLBACK_RECEIPT_INTEGRITY_FAILED");
  }
  assertTrustedDeploymentAuthorized(targetReceipt);

  if (targetReceipt.action !== "DEPLOY") {
    throw new Error(`ROLLBACK_TARGET_NOT_DEPLOY: ${targetReceipt.action}`);
  }
  if (targetReceipt.environment !== state.environment) {
    throw new Error(
      `ROLLBACK_ENVIRONMENT_MISMATCH: ${targetReceipt.environment} != ${state.environment}`,
    );
  }

  const knownTarget = state.history.some(
    (event) => event.receipt_id === targetReceipt.receipt_id,
  );
  if (!knownTarget) {
    throw new Error("ROLLBACK_TARGET_NOT_IN_CHRONICLE");
  }

  const event = createEvent({
    state,
    receipt: targetReceipt,
    type: "ROLLBACK",
    rollback_from_receipt_id: state.active_receipt_id,
  });

  return {
    ...state,
    active_receipt_id: targetReceipt.receipt_id,
    active_bundle_id: targetReceipt.bundle_id,
    active_logical_build_id: targetReceipt.logical_build_id,
    head_event_hash: event.event_hash,
    revision: state.revision + 1,
    history: [...state.history, event],
  };
}

export function verifyDeploymentChronicle(state: EnvironmentStateV1): boolean {
  let previous: string | undefined;

  for (const event of state.history) {
    const {
      event_id: _eventId,
      event_hash,
      ...unsigned
    } = event;

    if (event.previous_event_hash !== previous) return false;
    if (sha256Json(unsigned) !== event_hash) return false;
    previous = event_hash;
  }

  if ((state.history.at(-1)?.event_hash ?? undefined) !== state.head_event_hash) {
    return false;
  }

  return state.revision === state.history.length;
}
