import type { GovernanceSnapshotV1 } from "./GovernanceSnapshot";
import { verifyGovernanceSnapshot } from "./GovernanceSnapshot";
import type { TrustedDeploymentReceiptV1 } from "./TrustedDeploymentGate";
import { verifyTrustedDeploymentReceipt } from "./TrustedDeploymentGate";
import type { PromotionReceiptV1 } from "./PromotionPipeline";
import { verifyPromotionReceipt } from "./PromotionPipeline";
import type { ProductionReleaseReceiptV1 } from "./ProductionReleaseGate";
import { verifyProductionReleaseReceipt } from "./ProductionReleaseGate";
import { sha256Json } from "./BuildLedger";

export type GovernanceReceipt =
  | TrustedDeploymentReceiptV1
  | PromotionReceiptV1
  | ProductionReleaseReceiptV1;

export type GovernanceLedgerEntryV1 = {
  schema: "goodle.governance-ledger-entry.v1";
  entry_id: string;
  sequence: number;
  snapshot_id: string;
  snapshot_hash: string;
  operation: GovernanceSnapshotV1["operation"];
  destination_environment: string;
  receipt_type: GovernanceReceipt["schema"];
  receipt_id: string;
  receipt_hash: string;
  previous_entry_hash?: string;
  entry_hash: string;
};

export type GovernanceLedgerV1 = {
  schema: "goodle.governance-ledger.v1";
  entries: GovernanceLedgerEntryV1[];
  head_hash?: string;
  ledger_hash: string;
};

function receiptIdentity(receipt: GovernanceReceipt): {
  receipt_id: string;
  receipt_hash: string;
} {
  if (receipt.schema === "goodle.trusted-deployment-receipt.v1") {
    return { receipt_id: receipt.receipt_id, receipt_hash: receipt.receipt_hash };
  }
  if (receipt.schema === "goodle.promotion-receipt.v1") {
    return { receipt_id: receipt.promotion_id, receipt_hash: receipt.promotion_hash };
  }
  return { receipt_id: receipt.receipt_id, receipt_hash: receipt.receipt_hash };
}

function verifyReceipt(receipt: GovernanceReceipt): boolean {
  if (receipt.schema === "goodle.trusted-deployment-receipt.v1") {
    return verifyTrustedDeploymentReceipt(receipt);
  }
  if (receipt.schema === "goodle.promotion-receipt.v1") {
    return verifyPromotionReceipt(receipt);
  }
  return verifyProductionReleaseReceipt(receipt);
}

function hashLedger(
  entries: GovernanceLedgerEntryV1[],
  head_hash?: string,
): string {
  return sha256Json({
    schema: "goodle.governance-ledger.v1",
    entries,
    head_hash,
  });
}

export function createGovernanceLedger(): GovernanceLedgerV1 {
  const entries: GovernanceLedgerEntryV1[] = [];
  return {
    schema: "goodle.governance-ledger.v1",
    entries,
    head_hash: undefined,
    ledger_hash: hashLedger(entries, undefined),
  };
}

export function appendGovernanceDecision(
  ledger: GovernanceLedgerV1,
  snapshot: GovernanceSnapshotV1,
  receipt: GovernanceReceipt,
): GovernanceLedgerV1 {
  if (!verifyGovernanceLedger(ledger)) {
    throw new Error("GOVERNANCE_LEDGER_INTEGRITY_FAILED");
  }
  if (!verifyGovernanceSnapshot(snapshot)) {
    throw new Error("GOVERNANCE_LEDGER_SNAPSHOT_INVALID");
  }
  if (!verifyReceipt(receipt)) {
    throw new Error("GOVERNANCE_LEDGER_RECEIPT_INVALID");
  }

  const identity = receiptIdentity(receipt);
  const unsigned = {
    schema: "goodle.governance-ledger-entry.v1" as const,
    sequence: ledger.entries.length + 1,
    snapshot_id: snapshot.snapshot_id,
    snapshot_hash: snapshot.snapshot_hash,
    operation: snapshot.operation,
    destination_environment: snapshot.destination_environment,
    receipt_type: receipt.schema,
    receipt_id: identity.receipt_id,
    receipt_hash: identity.receipt_hash,
    previous_entry_hash: ledger.head_hash,
  };

  const entry_hash = sha256Json(unsigned);
  const entry: GovernanceLedgerEntryV1 = {
    ...unsigned,
    entry_id: `governance-entry-${unsigned.sequence}-${entry_hash.slice(0, 12)}`,
    entry_hash,
  };

  const entries = [...ledger.entries, entry];

  return {
    schema: ledger.schema,
    entries,
    head_hash: entry_hash,
    ledger_hash: hashLedger(entries, entry_hash),
  };
}

export function verifyGovernanceLedger(
  ledger: GovernanceLedgerV1,
): boolean {
  let previous: string | undefined;

  for (let index = 0; index < ledger.entries.length; index += 1) {
    const entry = ledger.entries[index];
    if (!entry) return false;
    if (entry.sequence !== index + 1) return false;
    if (entry.previous_entry_hash !== previous) return false;

    const {
      entry_id: _entryId,
      entry_hash,
      ...unsigned
    } = entry;

    if (sha256Json(unsigned) !== entry_hash) return false;
    previous = entry_hash;
  }

  const expectedHead = ledger.entries.at(-1)?.entry_hash;
  if (ledger.head_hash !== expectedHead) return false;

  return ledger.ledger_hash === hashLedger(ledger.entries, ledger.head_hash);
}
