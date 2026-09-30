import { describe, expect, it } from "vitest";
import { addSemanticNode, createSemanticGraph } from "../grafo/SemanticGraph";
import { buildGoodleProject } from "./BuildOrchestrator";
import { createBuildReport } from "./BuildReport";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "./executores";

function graph() {
  return addSemanticNode(createSemanticGraph("graph-report"), {
    id: "node-report",
    semantic_id: "estrutura.interface",
    kind: "structure",
    authority: "CANONICAL",
    provenance_refs: ["prov-report"],
    attributes: {},
  });
}

function sink() {
  const files = new Map<string, string>();
  return {
    files,
    exists: (path: string) => files.has(path),
    write: (path: string, content: string) => files.set(path, content),
  };
}

describe("M15 Build Report", () => {
  it("reports successful gates and planned files in dry-run", () => {
    const result = buildGoodleProject({
      graph: graph(),
      target: { kind: "web", adapter: "react", version: "19" },
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
      sink: sink(),
    });

    const report = createBuildReport(result);

    expect(report.schema).toBe("goodle.build-report.v1");
    expect(report.summary).toMatchObject({
      total_nodes: 1,
      executed_nodes: 1,
      artifacts: 1,
      files_planned: 3,
      files_written: 0,
    });
    expect(report.gates[0]).toMatchObject({
      support: "PASSED",
      runtime_evidence: "PASSED",
      executor: "PASSED",
      materialization: "PASSED",
      write: "PLANNED",
    });
  });

  it("explains contract-only blocking", () => {
    const result = buildGoodleProject({
      graph: graph(),
      target: { kind: "world", adapter: "hnk-verse", version: "0.1" },
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
      sink: sink(),
      mode: "APPLY",
    });

    const report = createBuildReport(result);

    expect(report.status).toBe("BLOCKED");
    expect(report.gates[0]).toMatchObject({
      support: "PASSED",
      runtime_evidence: "FAILED",
      executor: "NOT_REACHED",
      materialization: "NOT_REACHED",
      write: "NOT_REACHED",
    });
    expect(report.diagnostics[0]?.code).toBe("BLOCKED_CONTRACT_ONLY");
  });
});
