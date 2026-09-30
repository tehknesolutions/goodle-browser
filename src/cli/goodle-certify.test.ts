import { describe, expect, it } from "vitest";
import { certifyBuildReport } from "../nucleo/manifestacao/BuildCertification";
import type { BuildReportV1 } from "../nucleo/manifestacao/BuildReport";

describe("M16 certification CLI contract", () => {
  it("uses CERTIFIED as the only certifiable state", () => {
    const report: BuildReportV1 = {
      schema: "goodle.build-report.v1",
      build_id: "build-cli",
      graph_id: "graph-cli",
      status: "COMPLETED",
      target: { kind: "web", adapter: "react", version: "19" },
      summary: {
        total_nodes: 1,
        executed_nodes: 1,
        blocked_nodes: 0,
        failed_nodes: 0,
        artifacts: 1,
        files_planned: 3,
        files_written: 0,
        files_skipped: 0,
      },
      gates: [{
        source_ir: "node-1",
        support: "PASSED",
        runtime_evidence: "PASSED",
        executor: "PASSED",
        materialization: "PASSED",
        write: "PLANNED",
      }],
      diagnostics: [],
      artifacts: [{
        source_ir: "node-1",
        entry: ".goodle/generated/entry.tsx",
        files: ["entry.tsx", "manifest.json", "provenance.json"],
        provenance_refs: ["node-1"],
      }],
    };

    const result = certifyBuildReport(report);
    expect(result.status).toBe("CERTIFIED");
    expect(result.certifiable).toBe(true);
  });
});
