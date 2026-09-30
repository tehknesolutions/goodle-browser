import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { GovernanceSnapshotV1 } from "./GovernanceSnapshot";
import type { TrustedDeploymentReceiptV1 } from "./TrustedDeploymentGate";
import {
  appendGovernanceDecision,
  createGovernanceLedger,
  verifyGovernanceLedger,
} from "./GovernanceLedger";

function snapshot(id: string, operation: "DEPLOY" | "PROMOTE" = "DEPLOY"): GovernanceSnapshotV1 {
  const unsigned = {
    schema: "goodle.governance-snapshot.v1" as const,
    registry_hash: `registry-${id}`,
    operation,
    source_environment: operation === "PROMOTE" ? "development" : undefined,
    destination_environment: operation === "PROMOTE" ? "staging" : "development",
    environment_policy: {
      environment: operation === "PROMOTE" ? "staging" : "development",
      require_certified: true,
      allow_partial: false,
      allowed_adapters: ["react"],
      allowed_kinds: ["web" as const],
      require_released_manifest: false,
    },
    transition:
      operation === "PROMOTE"
        ? { from: "development", to: "staging", allowed: true }
        : undefined,
    target: { kind: "web" as const, adapter: "react", version: "19" },
    release_status: undefined,
    policy_hash: `policy-${id}`,
  };

  const snapshot_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    snapshot_id: `governance-${id}`,
    snapshot_hash,
  };
}

function deploymentReceipt(id: string): TrustedDeploymentReceiptV1 {
  const unsigned = {
    schema: "goodle.trusted-deployment-receipt.v1" as const,
    action: "DEPLOY" as const,
    environment: "development",
    bundle_id: `bundle-${id}`,
    build_id: `build-${id}`,
    logical_build_id: `rbi-${id}`,
    attestation_id: `attest-${id}`,
    ledger_hash: `build-ledger-${id}`,
    verification: {
      schema: "goodle.trusted-bundle-verification.v1" as const,
      bundle_id: `bundle-${id}`,
      build_id: `build-${id}`,
      logical_build_id: `rbi-${id}`,
      decision: "ACCEPTED" as const,
      executable: true,
      reasons: [],
      integrity: {
        valid: true,
        attestation_valid: true,
        bundle_hash_valid: true,
        files_valid: true,
        invalid_files: [],
      },
    },
    status: "AUTHORIZED" as const,
  };

  const receipt_hash = sha256Json(unsigned);
  return {
    ...unsigned,
    receipt_id: `deploy-${id}`,
    receipt_hash,
  };
}

describe("M32 Governance Ledger", () => {
  it("appends governance decisions in a verifiable hash chain", () => {
    let ledger = createGovernanceLedger();
    ledger = appendGovernanceDecision(
      ledger,
      snapshot("1"),
      deploymentReceipt("1"),
    );
    ledger = appendGovernanceDecision(
      ledger,
      snapshot("2"),
      deploymentReceipt("2"),
    );

    expect(ledger.entries).toHaveLength(2);
    expect(ledger.entries[1]?.previous_entry_hash).toBe(
      ledger.entries[0]?.entry_hash,
    );
    expect(ledger.head_hash).toBe(ledger.entries[1]?.entry_hash);
    expect(verifyGovernanceLedger(ledger)).toBe(true);
  });

  it("detects historical decision tampering", () => {
    let ledger = createGovernanceLedger();
    ledger = appendGovernanceDecision(
      ledger,
      snapshot("1"),
      deploymentReceipt("1"),
    );

    const tampered = {
      ...ledger,
      entries: ledger.entries.map((entry) => ({
        ...entry,
        destination_environment: "production",
      })),
    };

    expect(verifyGovernanceLedger(tampered)).toBe(false);
  });

  it("rejects invalid receipts before they enter the ledger", () => {
    const receipt = deploymentReceipt("1");

    expect(() =>
      appendGovernanceDecision(
        createGovernanceLedger(),
        snapshot("1"),
        { ...receipt, receipt_hash: "tampered" },
      ),
    ).toThrow("GOVERNANCE_LEDGER_RECEIPT_INVALID");
  });
});
