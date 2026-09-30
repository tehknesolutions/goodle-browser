import { describe, expect, it } from "vitest";
import { addSemanticNode, createSemanticGraph } from "../grafo/SemanticGraph";
import type { BuildCertificationV1 } from "../manifestacao/BuildCertification";
import type { BuildReportV1 } from "../manifestacao/BuildReport";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "../manifestacao/executores";
import {
  compareReproducibleBuildIdentity,
  createReproducibleBuildIdentity,
} from "./ReproducibleBuildIdentity";

const graph = addSemanticNode(createSemanticGraph("graph-rbi"), {
  id: "node-1",
  semantic_id: "estrutura.interface",
  kind: "structure",
  authority: "CANONICAL",
  provenance_refs: ["prov-1"],
  attributes: {},
});

const report: BuildReportV1 = {
  schema: "goodle.build-report.v1",
  build_id: "build-rbi",
  graph_id: "graph-rbi",
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
  build_id: "build-rbi",
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

describe("M18 Reproducible Build Identity", () => {
  it("produces identical logical identity for equivalent builds", () => {
    const a = createReproducibleBuildIdentity({
      graph,
      report,
      certification,
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
    });
    const b = createReproducibleBuildIdentity({
      graph,
      report,
      certification,
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
    });

    expect(a.logical_build_id).toBe(b.logical_build_id);
    expect(compareReproducibleBuildIdentity(a, b).equivalent).toBe(true);
  });

  it("detects graph drift", () => {
    const base = createReproducibleBuildIdentity({
      graph,
      report,
      certification,
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
    });
    const changedGraph = addSemanticNode(graph, {
      id: "node-2",
      semantic_id: "dados.player",
      kind: "data",
      authority: "CANONICAL",
      provenance_refs: ["prov-2"],
      attributes: {},
    });
    const changedReport = { ...report, graph_id: changedGraph.graph_id };

    const changed = createReproducibleBuildIdentity({
      graph: changedGraph,
      report: changedReport,
      certification,
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
    });

    expect(compareReproducibleBuildIdentity(base, changed)).toMatchObject({
      equivalent: false,
      graph_drift: true,
    });
  });

  it("detects artifact drift independently", () => {
    const base = createReproducibleBuildIdentity({
      graph,
      report,
      certification,
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
    });
    const changed = createReproducibleBuildIdentity({
      graph,
      report: {
        ...report,
        artifacts: [{
          ...report.artifacts[0],
          files: [...report.artifacts[0].files, "extra.ts"],
        }],
      },
      certification,
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
    });

    expect(compareReproducibleBuildIdentity(base, changed)).toMatchObject({
      equivalent: false,
      artifacts_drift: true,
    });
  });
});
