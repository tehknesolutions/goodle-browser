import type { PublicationReceiptV1 } from "./PublicationRegistry";
import { verifyPublicationReceipt } from "./PublicationRegistry";
import type {
  PublicationRevocationReceiptV1,
  PublicationStateV1,
} from "./PublicationRevocationRegistry";
import {
  verifyPublicationRevocationReceipt,
  verifyPublicationState,
} from "./PublicationRevocationRegistry";
import { sha256Json } from "./BuildLedger";

export type PublicationReinstatementAction =
  | "REINSTATED"
  | "RELISTED"
  | "HNK_VERSE_READMITTED";

export type PublicationReinstatementReceiptV1 = {
  schema: "goodle.publication-reinstatement-receipt.v1";
  receipt_id: string;
  publication_receipt_id: string;
  publication_receipt_hash: string;
  revocation_receipt_id: string;
  revocation_receipt_hash: string;
  package_id: string;
  package_hash: string;
  target: PublicationReceiptV1["target"];
  action: PublicationReinstatementAction;
  registry_ref: string;
  reason_code: string;
  status: "REINSTATED";
  receipt_hash: string;
};

export type PublicationLifecycleEventV1 =
  | {
      kind: "PUBLICATION";
      receipt_id: string;
      receipt_hash: string;
    }
  | {
      kind: "REVOCATION";
      receipt_id: string;
      receipt_hash: string;
    }
  | {
      kind: "REINSTATEMENT";
      receipt_id: string;
      receipt_hash: string;
    };

export type PublicationLifecycleTimelineV1 = {
  schema: "goodle.publication-lifecycle-timeline.v1";
  package_id: string;
  target: PublicationReceiptV1["target"];
  registry_ref: string;
  state: "ACTIVE" | "REVOKED";
  events: PublicationLifecycleEventV1[];
  timeline_hash: string;
};

function actionForTarget(
  target: PublicationReceiptV1["target"],
): PublicationReinstatementAction {
  switch (target) {
    case "MARKETPLACE":
      return "RELISTED";
    case "HNK_VERSE":
      return "HNK_VERSE_READMITTED";
    case "IMPORT":
    case "PUBLISH":
      return "REINSTATED";
  }
}

export function createPublicationReinstatementReceipt(input: {
  publication_receipt: PublicationReceiptV1;
  revocation_receipt: PublicationRevocationReceiptV1;
  revoked_state: PublicationStateV1;
  reason_code: string;
}): PublicationReinstatementReceiptV1 {
  if (!verifyPublicationReceipt(input.publication_receipt)) {
    throw new Error("PUBLICATION_REINSTATEMENT_PUBLICATION_RECEIPT_INVALID");
  }
  if (!verifyPublicationRevocationReceipt(input.revocation_receipt)) {
    throw new Error("PUBLICATION_REINSTATEMENT_REVOCATION_RECEIPT_INVALID");
  }
  if (!verifyPublicationState(input.revoked_state)) {
    throw new Error("PUBLICATION_REINSTATEMENT_STATE_INVALID");
  }
  if (input.revoked_state.state !== "REVOKED" || input.revoked_state.active) {
    throw new Error("PUBLICATION_REINSTATEMENT_REQUIRES_REVOKED_STATE");
  }
  if (!input.reason_code.trim()) {
    throw new Error("PUBLICATION_REINSTATEMENT_REASON_REQUIRED");
  }

  if (
    input.revocation_receipt.publication_receipt_id !==
      input.publication_receipt.receipt_id ||
    input.revocation_receipt.publication_receipt_hash !==
      input.publication_receipt.receipt_hash ||
    input.revoked_state.publication_receipt_id !==
      input.publication_receipt.receipt_id ||
    input.revoked_state.publication_receipt_hash !==
      input.publication_receipt.receipt_hash ||
    input.revoked_state.revocation_receipt_id !==
      input.revocation_receipt.receipt_id ||
    input.revoked_state.revocation_receipt_hash !==
      input.revocation_receipt.receipt_hash
  ) {
    throw new Error("PUBLICATION_REINSTATEMENT_LINK_MISMATCH");
  }

  const unsigned = {
    schema: "goodle.publication-reinstatement-receipt.v1" as const,
    publication_receipt_id: input.publication_receipt.receipt_id,
    publication_receipt_hash: input.publication_receipt.receipt_hash,
    revocation_receipt_id: input.revocation_receipt.receipt_id,
    revocation_receipt_hash: input.revocation_receipt.receipt_hash,
    package_id: input.publication_receipt.package_id,
    package_hash: input.publication_receipt.package_hash,
    target: input.publication_receipt.target,
    action: actionForTarget(input.publication_receipt.target),
    registry_ref: input.publication_receipt.registry_ref,
    reason_code: input.reason_code,
    status: "REINSTATED" as const,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `publication-reinstatement-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function verifyPublicationReinstatementReceipt(
  receipt: PublicationReinstatementReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;
  return sha256Json(unsigned) === receipt_hash;
}

export function derivePublicationLifecycleTimeline(input: {
  publication_receipt: PublicationReceiptV1;
  revocation_receipt?: PublicationRevocationReceiptV1;
  reinstatement_receipt?: PublicationReinstatementReceiptV1;
}): PublicationLifecycleTimelineV1 {
  if (!verifyPublicationReceipt(input.publication_receipt)) {
    throw new Error("PUBLICATION_TIMELINE_PUBLICATION_RECEIPT_INVALID");
  }

  const events: PublicationLifecycleEventV1[] = [
    {
      kind: "PUBLICATION",
      receipt_id: input.publication_receipt.receipt_id,
      receipt_hash: input.publication_receipt.receipt_hash,
    },
  ];

  let state: "ACTIVE" | "REVOKED" = "ACTIVE";

  if (input.revocation_receipt) {
    if (!verifyPublicationRevocationReceipt(input.revocation_receipt)) {
      throw new Error("PUBLICATION_TIMELINE_REVOCATION_RECEIPT_INVALID");
    }
    if (
      input.revocation_receipt.publication_receipt_id !==
        input.publication_receipt.receipt_id ||
      input.revocation_receipt.publication_receipt_hash !==
        input.publication_receipt.receipt_hash
    ) {
      throw new Error("PUBLICATION_TIMELINE_REVOCATION_LINK_MISMATCH");
    }

    events.push({
      kind: "REVOCATION",
      receipt_id: input.revocation_receipt.receipt_id,
      receipt_hash: input.revocation_receipt.receipt_hash,
    });
    state = "REVOKED";
  }

  if (input.reinstatement_receipt) {
    if (!input.revocation_receipt) {
      throw new Error("PUBLICATION_TIMELINE_REINSTATEMENT_WITHOUT_REVOCATION");
    }
    if (!verifyPublicationReinstatementReceipt(input.reinstatement_receipt)) {
      throw new Error("PUBLICATION_TIMELINE_REINSTATEMENT_RECEIPT_INVALID");
    }
    if (
      input.reinstatement_receipt.publication_receipt_id !==
        input.publication_receipt.receipt_id ||
      input.reinstatement_receipt.revocation_receipt_id !==
        input.revocation_receipt.receipt_id ||
      input.reinstatement_receipt.revocation_receipt_hash !==
        input.revocation_receipt.receipt_hash
    ) {
      throw new Error("PUBLICATION_TIMELINE_REINSTATEMENT_LINK_MISMATCH");
    }

    events.push({
      kind: "REINSTATEMENT",
      receipt_id: input.reinstatement_receipt.receipt_id,
      receipt_hash: input.reinstatement_receipt.receipt_hash,
    });
    state = "ACTIVE";
  }

  const unsigned = {
    schema: "goodle.publication-lifecycle-timeline.v1" as const,
    package_id: input.publication_receipt.package_id,
    target: input.publication_receipt.target,
    registry_ref: input.publication_receipt.registry_ref,
    state,
    events,
  };

  return {
    ...unsigned,
    timeline_hash: sha256Json(unsigned),
  };
}

export function verifyPublicationLifecycleTimeline(
  timeline: PublicationLifecycleTimelineV1,
): boolean {
  const { timeline_hash, ...unsigned } = timeline;
  return sha256Json(unsigned) === timeline_hash;
}
