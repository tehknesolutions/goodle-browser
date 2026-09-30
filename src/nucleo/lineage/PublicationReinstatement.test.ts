import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { PublicationReceiptV1 } from "./PublicationRegistry";
import {
  createPublicationRevocationReceipt,
  derivePublicationState,
} from "./PublicationRevocationRegistry";
import {
  createPublicationReinstatementReceipt,
  derivePublicationLifecycleTimeline,
  verifyPublicationLifecycleTimeline,
} from "./PublicationReinstatement";

function publication(target: "IMPORT" | "PUBLISH" | "MARKETPLACE" | "HNK_VERSE"): PublicationReceiptV1 {
  const unsigned = {
    schema: "goodle.publication-receipt.v1" as const,
    package_id: "pkg-49",
    package_hash: "pkg-hash-49",
    target,
    action:
      target === "MARKETPLACE"
        ? "MARKETPLACE_LISTED" as const
        : target === "HNK_VERSE"
          ? "HNK_VERSE_ADMITTED" as const
          : target === "IMPORT"
            ? "IMPORTED" as const
            : "PUBLISHED" as const,
    registry_ref: `${target.toLowerCase()}://goodle/pkg-49`,
    status: "COMPLETED" as const,
  };

  return {
    ...unsigned,
    receipt_id: "publication-49",
    receipt_hash: sha256Json(unsigned),
  };
}

function revoked(target: "IMPORT" | "PUBLISH" | "MARKETPLACE" | "HNK_VERSE") {
  const receipt = publication(target);
  const fakeRegistry = {
    schema: "goodle.publication-registry.v1" as const,
    entries: [{
      schema: "goodle.publication-registry-entry.v1" as const,
      entry_id: "entry-1",
      sequence: 1,
      package_id: receipt.package_id,
      package_hash: receipt.package_hash,
      target: receipt.target,
      action: receipt.action,
      receipt_id: receipt.receipt_id,
      receipt_hash: receipt.receipt_hash,
      previous_entry_hash: undefined,
      entry_hash: "",
    }],
    head_hash: undefined as string | undefined,
    registry_hash: "",
  };

  const entryUnsigned = {
    schema: fakeRegistry.entries[0]!.schema,
    sequence: 1,
    package_id: receipt.package_id,
    package_hash: receipt.package_hash,
    target: receipt.target,
    action: receipt.action,
    receipt_id: receipt.receipt_id,
    receipt_hash: receipt.receipt_hash,
    previous_entry_hash: undefined,
  };
  const entry_hash = sha256Json(entryUnsigned);
  fakeRegistry.entries[0] = {
    ...fakeRegistry.entries[0]!,
    entry_hash,
  };
  fakeRegistry.head_hash = entry_hash;
  fakeRegistry.registry_hash = sha256Json({
    schema: fakeRegistry.schema,
    entries: fakeRegistry.entries,
    head_hash: fakeRegistry.head_hash,
  });

  const revocation = createPublicationRevocationReceipt({
    publication_receipt: receipt,
    registry: fakeRegistry,
    reason_code: "OWNER_REQUEST",
  });
  const state = derivePublicationState({
    publication_receipt: receipt,
    revocation_receipt: revocation,
  });

  return { receipt, revocation, state };
}

describe("M49 Publication Reinstatement", () => {
  it("relists a marketplace publication after revocation", () => {
    const { receipt, revocation, state } = revoked("MARKETPLACE");

    const reinstatement = createPublicationReinstatementReceipt({
      publication_receipt: receipt,
      revocation_receipt: revocation,
      revoked_state: state,
      reason_code: "OWNER_RESTORED",
    });

    const timeline = derivePublicationLifecycleTimeline({
      publication_receipt: receipt,
      revocation_receipt: revocation,
      reinstatement_receipt: reinstatement,
    });

    expect(reinstatement.action).toBe("RELISTED");
    expect(reinstatement.status).toBe("REINSTATED");
    expect(timeline.state).toBe("ACTIVE");
    expect(timeline.events.map((event) => event.kind)).toEqual([
      "PUBLICATION",
      "REVOCATION",
      "REINSTATEMENT",
    ]);
    expect(verifyPublicationLifecycleTimeline(timeline)).toBe(true);
  });

  it("readmits HNK-VERSE distinctly", () => {
    const { receipt, revocation, state } = revoked("HNK_VERSE");

    const reinstatement = createPublicationReinstatementReceipt({
      publication_receipt: receipt,
      revocation_receipt: revocation,
      revoked_state: state,
      reason_code: "GOVERNANCE_REAPPROVED",
    });

    expect(reinstatement.action).toBe("HNK_VERSE_READMITTED");
  });

  it("refuses reinstatement when state is not revoked", () => {
    const receipt = publication("PUBLISH");
    const activeState = derivePublicationState({
      publication_receipt: receipt,
    });
    const { revocation } = revoked("PUBLISH");

    expect(() =>
      createPublicationReinstatementReceipt({
        publication_receipt: receipt,
        revocation_receipt: revocation,
        revoked_state: activeState,
        reason_code: "INVALID",
      }),
    ).toThrow("PUBLICATION_REINSTATEMENT_REQUIRES_REVOKED_STATE");
  });

  it("rejects a reinstatement timeline without prior revocation", () => {
    const { receipt, revocation, state } = revoked("IMPORT");
    const reinstatement = createPublicationReinstatementReceipt({
      publication_receipt: receipt,
      revocation_receipt: revocation,
      revoked_state: state,
      reason_code: "RESTORED",
    });

    expect(() =>
      derivePublicationLifecycleTimeline({
        publication_receipt: receipt,
        reinstatement_receipt: reinstatement,
      }),
    ).toThrow("PUBLICATION_TIMELINE_REINSTATEMENT_WITHOUT_REVOCATION");
  });
});
