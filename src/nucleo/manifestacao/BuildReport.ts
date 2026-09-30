import type { GoodleBuildResult } from "./BuildOrchestrator";

export type BuildDiagnosticSeverity = "INFO" | "WARN" | "ERROR";

export type BuildDiagnostic = {
  code: string;
  severity: BuildDiagnosticSeverity;
  message: string;
  source_ir?: string;
  target_id?: string;
};

export type BuildGateReport = {
  source_ir: string;
  support: "PASSED" | "FAILED";
  runtime_evidence: "PASSED" | "FAILED" | "NOT_REACHED";
  executor: "PASSED" | "FAILED" | "NOT_REACHED";
  materialization: "PASSED" | "NOT_REACHED";
  write: "PLANNED" | "APPLIED" | "NOT_REACHED";
};

export type BuildReportV1 = {
  schema: "goodle.build-report.v1";
  build_id: string;
  graph_id: string;
  status: GoodleBuildResult["status"];
  target: GoodleBuildResult["target"];
  summary: {
    total_nodes: number;
    executed_nodes: number;
    blocked_nodes: number;
    failed_nodes: number;
    artifacts: number;
    files_planned: number;
    files_written: number;
    files_skipped: number;
  };
  gates: BuildGateReport[];
  diagnostics: BuildDiagnostic[];
  artifacts: Array<{
    source_ir: string;
    entry: string;
    files: string[];
    provenance_refs: string[];
  }>;
};

function diagnosticForNode(
  node: GoodleBuildResult["nodes"][number],
): BuildDiagnostic[] {
  const status = node.execution.status;

  if (status === "EXECUTED") {
    const skipped = node.write?.skipped.length ?? 0;
    return skipped > 0
      ? [{
          code: "FILES_SKIPPED",
          severity: "WARN",
          message: `${skipped} file(s) skipped by write policy`,
          source_ir: node.source_ir,
          target_id: node.execution.target_id,
        }]
      : [];
  }

  const messages: Record<string, string> = {
    BLOCKED_UNSUPPORTED: "Target is not supported by the capability inventory",
    BLOCKED_CONTRACT_ONLY: "Target has contract evidence but no runtime evidence",
    BLOCKED_NO_EXECUTOR: "No runtime executor is registered for this target",
    FAILED: node.execution.error ?? "Target execution failed",
  };

  return [{
    code: status,
    severity: status === "FAILED" ? "ERROR" : "WARN",
    message: messages[status] ?? node.execution.error ?? status,
    source_ir: node.source_ir,
    target_id: node.execution.target_id,
  }];
}

export function createBuildReport(result: GoodleBuildResult): BuildReportV1 {
  const diagnostics = result.nodes.flatMap(diagnosticForNode);

  const gates: BuildGateReport[] = result.nodes.map((node) => {
    const status = node.execution.status;
    const unsupported = status === "BLOCKED_UNSUPPORTED";
    const contractOnly = status === "BLOCKED_CONTRACT_ONLY";
    const noExecutor = status === "BLOCKED_NO_EXECUTOR";
    const executed = status === "EXECUTED";

    return {
      source_ir: node.source_ir,
      support: unsupported ? "FAILED" : "PASSED",
      runtime_evidence: unsupported
        ? "NOT_REACHED"
        : contractOnly
          ? "FAILED"
          : "PASSED",
      executor: unsupported || contractOnly
        ? "NOT_REACHED"
        : noExecutor
          ? "FAILED"
          : "PASSED",
      materialization: executed && node.artifact ? "PASSED" : "NOT_REACHED",
      write: node.write
        ? node.write.mode === "APPLY"
          ? "APPLIED"
          : "PLANNED"
        : "NOT_REACHED",
    };
  });

  const artifacts = result.nodes.flatMap((node) =>
    node.artifact
      ? [{
          source_ir: node.source_ir,
          entry: node.artifact.entry,
          files: node.artifact.files.map((file) => file.path),
          provenance_refs: [...node.artifact.provenance.provenance_refs],
        }]
      : [],
  );

  const filesPlanned = result.nodes.reduce(
    (total, node) => total + (node.write?.plan.length ?? 0),
    0,
  );
  const filesWritten = result.nodes.reduce(
    (total, node) =>
      total + (node.write?.mode === "APPLY" ? node.write.written.length : 0),
    0,
  );
  const filesSkipped = result.nodes.reduce(
    (total, node) => total + (node.write?.skipped.length ?? 0),
    0,
  );

  return {
    schema: "goodle.build-report.v1",
    build_id: result.build_id,
    graph_id: result.graph_id,
    status: result.status,
    target: result.target,
    summary: {
      total_nodes: result.nodes.length,
      executed_nodes: result.nodes.filter((node) => node.execution.status === "EXECUTED").length,
      blocked_nodes: result.nodes.filter((node) => node.execution.status.startsWith("BLOCKED_")).length,
      failed_nodes: result.nodes.filter((node) => node.execution.status === "FAILED").length,
      artifacts: artifacts.length,
      files_planned: filesPlanned,
      files_written: filesWritten,
      files_skipped: filesSkipped,
    },
    gates,
    diagnostics,
    artifacts,
  };
}
