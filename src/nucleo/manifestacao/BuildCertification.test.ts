import { describe, expect, it } from "vitest";
import type { BuildReportV1 } from "./BuildReport";
import { certifyBuildReport } from "./BuildCertification";

function report(overrides: Partial<BuildReportV1> = {}): BuildReportV1 {
  return {
    schema: "goodle.build-report.v1",
    build_id: "build-1",
    graph_id: "graph-1",
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
    ...overrides,
  };
}

describe("M16 Build Certification", () => {
  it("certifies a fully conformant completed build", () => {
    expect(certifyBuildReport(report())).toMatchObject({
      schema: "goodle.build-certification.v1",
      status: "CERTIFIED",
      certifiable: true,
      reasons: [],
    });
  });

  it("marks a partially executed build as PARTIAL", () => {
    const partial = report({
      status: "PARTIAL",
      summary: {
        ...report().summary,
        total_nodes: 2,
        executed_nodes: 1,
        blocked_nodes: 1,
      },
    });

    expect(certifyBuildReport(partial)).toMatchObject({
      status: "PARTIAL",
      certifiable: false,
    });
  });

  it("rejects a blocked build", () => {
    const blocked = report({
      status: "BLOCKED",
      summary: {
        ...report().summary,
        executed_nodes: 0,
        blocked_nodes: 1,
        artifacts: 0,
      },
      gates: [{
        source_ir: "node-1",
        support: "PASSED",
        runtime_evidence: "FAILED",
        executor: "NOT_REACHED",
        materialization: "NOT_REACHED",
        write: "NOT_REACHED",
      }],
      artifacts: [],
    });

    const certification = certifyBuildReport(blocked);

    expect(certification.status).toBe("REJECTED");
    expect(certification.reasons).toContain("FAILED_GATES_PRESENT");
    expect(certification.reasons).toContain("NO_EXECUTED_NODES");
  });

  it("rejects error diagnostics even when report says completed", () => {
    const invalid = report({
      diagnostics: [{
        code: "INTERNAL_ERROR",
        severity: "ERROR",
        message: "failure",
      }],
    });

    expect(certifyBuildReport(invalid)).toMatchObject({
      status: "REJECTED",
      certifiable: false,
    });
  });
});
