import { describe, expect, it } from "vitest";
import type { BuildCertificationV1 } from "../manifestacao/BuildCertification";
import type { BuildReportV1 } from "../manifestacao/BuildReport";
import { createBuildLedgerRecord } from "./BuildLedger";
import {
  createBuildAttestation,
  verifyBuildAttestation,
} from "./BuildAttestation";
import type { ReproducibleBuildIdentityV1 } from "./ReproducibleBuildIdentity";

const report: BuildReportV1 = {
  schema: "goodle.build-report.v1",
  build_id: "build-attestation",
  graph_id: "graph-attestation",
  status: "COMPLETED",
  target: { kind: "web", adapter: "react", version: "19" },
  summary: {
    total_nodes: 1,
    executed_nodes: 1,
    blocked_nodes: 0,
    failed_nodes: 0,
    artifacts: 1,
    files_planned: 3,
    files_written: 3,
    files_skipped: 0,
  },
  gates: [{
    source_ir: "node-1",
    support: "PASSED",
    runtime_evidence: "PASSED",
    executor: "PASSED",
    materialization: "PASSED",
    write: "APPLIED",
  }],
  diagnostics: [],
  artifacts: [{
    source_ir: "node-1",
    entry: ".goodle/generated/entry.tsx",
    files: ["entry.tsx", "manifest.json", "provenance.json"],
    provenance_refs: ["prov-b", "prov-a", "prov-a"],
  }],
};

const certification: BuildCertificationV1 = {
  schema: "goodle.build-certification.v1",
  build_id: "build-attestation",
  report_schema: "goodle.build-report.v1",
  status: "CERTIFIED",
  certifiable: true,
  reasons: [],
  metrics: {
    total_nodes: 1,
    executed_nodes: 1,
    blocked_nodes: 0,
    failed_nodes: 0,
    error_diagnostics: 0,
    failed_gates: 0,
  },
};

const ledger = createBuildLedgerRecord({ report, certification });

const identity: ReproducibleBuildIdentityV1 = {
  schema: "goodle.reproducible-build-identity.v1",
  logical_build_id: "rbi-1234567890abcdef",
  graph_hash: "graph-hash",
  target_hash: "target-hash",
  executor_hash: "executor-hash",
  artifacts_hash: "artifact-hash",
  certification_hash: ledger.certification_hash,
  composite_hash: "identity-hash",
};

describe("M19 Build Attestation", () => {
  it("creates a deterministic verifiable trust envelope", () => {
    const a = createBuildAttestation({ report, certification, ledger, identity });
    const b = createBuildAttestation({ report, certification, ledger, identity });

    expect(a.attestation_id).toBe(b.attestation_id);
    expect(a.envelope_hash).toBe(b.envelope_hash);
    expect(a.provenance_refs).toEqual(["prov-a", "prov-b"]);
    expect(verifyBuildAttestation(a)).toBe(true);
  });

  it("rejects a broken ledger chain payload", () => {
    expect(() => createBuildAttestation({
      report,
      certification,
      ledger: { ...ledger, record_hash: "tampered" },
      identity,
    })).toThrow("ATTESTATION_LEDGER_INTEGRITY_FAILED");
  });

  it("rejects report hash divergence", () => {
    expect(() => createBuildAttestation({
      report: { ...report, graph_id: "other-graph" },
      certification,
      ledger,
      identity,
    })).toThrow("ATTESTATION_REPORT_HASH_MISMATCH");
  });

  it("detects tampering in the final envelope", () => {
    const attestation = createBuildAttestation({
      report,
      certification,
      ledger,
      identity,
    });

    expect(verifyBuildAttestation({
      ...attestation,
      certification_status: "REJECTED",
    })).toBe(false);
  });
});
