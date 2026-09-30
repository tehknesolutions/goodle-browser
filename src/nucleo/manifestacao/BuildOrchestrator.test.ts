import { describe, expect, it } from "vitest";
import { createSemanticGraph, addSemanticNode } from "../grafo/SemanticGraph";
import { buildGoodleProject } from "./BuildOrchestrator";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "./executores";

function graphWithUiNode() {
  const graph = createSemanticGraph("graph-build-1");
  return addSemanticNode(graph, {
    id: "node-ui-1",
    semantic_id: "estrutura.interface",
    kind: "structure",
    authority: "CANONICAL",
    provenance_refs: ["prov-1"],
    attributes: {},
  });
}

function memorySink() {
  const files = new Map<string, string>();
  return {
    files,
    exists: (path: string) => files.has(path),
    write: (path: string, content: string) => files.set(path, content),
  };
}

describe("M13 End-to-End Build Orchestrator", () => {
  it("builds React from semantic graph to workspace in one operation", () => {
    const sink = memorySink();

    const result = buildGoodleProject({
      graph: graphWithUiNode(),
      target: { kind: "web", adapter: "react", version: "19" },
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
      sink,
      mode: "APPLY",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.execution.status).toBe("EXECUTED");
    expect(sink.files.has(".goodle/generated/src/generated/GoodleArtifact.tsx")).toBe(true);
    expect(sink.files.has(".goodle/generated/manifest.json")).toBe(true);
    expect(sink.files.has(".goodle/generated/provenance.json")).toBe(true);
  });

  it("supports dry-run without mutating the workspace", () => {
    const sink = memorySink();

    const result = buildGoodleProject({
      graph: graphWithUiNode(),
      target: { kind: "game", adapter: "phaser", version: "3" },
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
      sink,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.nodes[0]?.write?.mode).toBe("DRY_RUN");
    expect(sink.files.size).toBe(0);
  });

  it("returns BLOCKED when target is contract-only", () => {
    const sink = memorySink();

    const result = buildGoodleProject({
      graph: graphWithUiNode(),
      target: { kind: "world", adapter: "hnk-verse", version: "0.1" },
      executors: GOODLE_RUNTIME_EXECUTORS_V1,
      sink,
      mode: "APPLY",
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.nodes[0]?.execution.status).toBe("BLOCKED_CONTRACT_ONLY");
    expect(sink.files.size).toBe(0);
  });
});
