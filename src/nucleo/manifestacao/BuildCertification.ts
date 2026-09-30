import type { BuildReportV1 } from "./BuildReport";

export type BuildCertificationStatus = "CERTIFIED" | "PARTIAL" | "REJECTED";

export type BuildCertificationV1 = {
  schema: "goodle.build-certification.v1";
  build_id: string;
  report_schema: BuildReportV1["schema"];
  status: BuildCertificationStatus;
  certifiable: boolean;
  reasons: string[];
  metrics: {
    total_nodes: number;
    executed_nodes: number;
    blocked_nodes: number;
    failed_nodes: number;
    error_diagnostics: number;
    failed_gates: number;
  };
};

export function certifyBuildReport(report: BuildReportV1): BuildCertificationV1 {
  const reasons: string[] = [];
  const errorDiagnostics = report.diagnostics.filter(
    (diagnostic) => diagnostic.severity === "ERROR",
  ).length;

  const failedGates = report.gates.reduce((total, gate) => {
    const values = [
      gate.support,
      gate.runtime_evidence,
      gate.executor,
      gate.materialization,
    ];
    return total + values.filter((value) => value === "FAILED").length;
  }, 0);

  if (report.summary.failed_nodes > 0) {
    reasons.push("FAILED_NODES_PRESENT");
  }
  if (errorDiagnostics > 0) {
    reasons.push("ERROR_DIAGNOSTICS_PRESENT");
  }
  if (failedGates > 0) {
    reasons.push("FAILED_GATES_PRESENT");
  }
  if (report.summary.blocked_nodes > 0) {
    reasons.push("BLOCKED_NODES_PRESENT");
  }
  if (report.summary.executed_nodes === 0) {
    reasons.push("NO_EXECUTED_NODES");
  }
  if (report.summary.artifacts !== report.summary.executed_nodes) {
    reasons.push("ARTIFACT_COUNT_MISMATCH");
  }

  let status: BuildCertificationStatus;

  if (
    report.status === "COMPLETED" &&
    reasons.length === 0 &&
    report.summary.executed_nodes === report.summary.total_nodes
  ) {
    status = "CERTIFIED";
  } else if (
    report.status === "PARTIAL" &&
    report.summary.executed_nodes > 0 &&
    report.summary.failed_nodes === 0 &&
    errorDiagnostics === 0
  ) {
    status = "PARTIAL";
  } else {
    status = "REJECTED";
  }

  return {
    schema: "goodle.build-certification.v1",
    build_id: report.build_id,
    report_schema: report.schema,
    status,
    certifiable: status === "CERTIFIED",
    reasons,
    metrics: {
      total_nodes: report.summary.total_nodes,
      executed_nodes: report.summary.executed_nodes,
      blocked_nodes: report.summary.blocked_nodes,
      failed_nodes: report.summary.failed_nodes,
      error_diagnostics: errorDiagnostics,
      failed_gates: failedGates,
    },
  };
}
