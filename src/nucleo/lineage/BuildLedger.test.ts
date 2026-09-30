import { describe, expect, it } from "vitest";
import type { BuildCertificationV1 } from "../manifestacao/BuildCertification";
import type { BuildReportV1 } from "../manifestacao/BuildReport";
import {
  compareBuildLedgerRecords,
  createBuildLedgerRecord,
  verifyBuildLedgerRecord,
} from "./BuildLedger";

const report: BuildReportV1 = {
  schema: "goodle.build-report.v1",
  build_id: "build-ledger-1",
  graph_id: "graph-ledger-1",
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
    provenance_refs: ["prov-1"],
  }],
};

const certification: BuildCertificationV1 = {
  schema: "goodle.build-certification.v1",
  build_id: "build-ledger-1",
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

describe("M17 Build Ledger", () => {
  it("creates a deterministic verifiable ledger record", () => {
    const a = createBuildLedgerRecord({ report, certification });
    const b = createBuildLedgerRecord({ report, certification });

    expect(a.record_hash).toBe(b.record_hash);
    expect(a.record_id).toBe(b.record_id);
    expect(verifyBuildLedgerRecord(a)).toBe(true);
  });

  it("rejects mismatched build identity", () => {
    expect(() => createBuildLedgerRecord({
      report,
      certification: { ...certification, build_id: "other" },
    })).toThrow("LEDGER_BUILD_ID_MISMATCH");
  });

  it("chains and compares consecutive records", () => {
    const previous = createBuildLedgerRecord({ report, certification });
    const current = createBuildLedgerRecord({
      report: { ...report, build_id: "build-ledger-2" },
      certification: { ...certification, build_id: "build-ledger-2" },
      previous_record_hash: previous.record_hash,
    });

    expect(compareBuildLedgerRecords(previous, current)).toMatchObject({
      graph_changed: false,
      target_changed: false,
      certification_changed: false,
      artifacts_changed: false,
      chained: true,
    });
  });
});
