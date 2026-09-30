import type { SemanticGraph } from "../grafo/SemanticGraph";
import { executeSemanticPipeline } from "../grafo/SemanticPipeline";
import type { ManifestationKind } from "./ManifestationGraph";
import { materializeExecutionArtifact, type MaterializedArtifactTree } from "./ArtifactMaterializer";
import { writeMaterializedProject, type OverwritePolicy, type ProjectWriteResult, type WorkspaceFileSink, type WorkspaceWriteMode } from "./ProjectWriter";
import { executeManifestationTarget, type TargetExecutionResult, type TargetExecutorRegistry } from "./TargetExecutionRouter";

export type GoodleBuildTarget = {
  kind: ManifestationKind;
  adapter: string;
  version: string;
};

export type GoodleBuildRequest = {
  graph: SemanticGraph;
  target: GoodleBuildTarget;
  sink: WorkspaceFileSink;
  executors: TargetExecutorRegistry;
  mode?: WorkspaceWriteMode;
  overwrite?: OverwritePolicy;
  root?: string;
};

export type GoodleBuildNodeResult = {
  source_ir: string;
  execution: TargetExecutionResult;
  artifact?: MaterializedArtifactTree;
  write?: ProjectWriteResult;
};

export type GoodleBuildResult = {
  build_id: string;
  graph_id: string;
  target: GoodleBuildTarget;
  status: "COMPLETED" | "PARTIAL" | "BLOCKED";
  nodes: GoodleBuildNodeResult[];
};

export function buildGoodleProject(request: GoodleBuildRequest): GoodleBuildResult {
  const pipeline = executeSemanticPipeline(request.graph, {
    manifestation: request.target,
  });

  const nodes: GoodleBuildNodeResult[] = pipeline.ir.nos.map((source, index) => {
    const target = pipeline.manifestations[index];
    if (!target) {
      throw new Error(`MANIFESTATION_TARGET_MISSING: ${source.id}`);
    }

    const execution = executeManifestationTarget(target, source, request.executors);

    if (execution.status !== "EXECUTED") {
      return {
        source_ir: source.id,
        execution,
      };
    }

    const artifact = materializeExecutionArtifact(
      execution,
      request.root ?? ".goodle/generated",
    );

    const write = writeMaterializedProject(
      {
        tree: artifact,
        mode: request.mode,
        overwrite: request.overwrite,
      },
      request.sink,
    );

    return {
      source_ir: source.id,
      execution,
      artifact,
      write,
    };
  });

  const executedCount = nodes.filter((node) => node.execution.status === "EXECUTED").length;
  const status =
    executedCount === nodes.length
      ? "COMPLETED"
      : executedCount === 0
        ? "BLOCKED"
        : "PARTIAL";

  return {
    build_id: `build-${request.graph.graph_id}-${request.target.adapter}-${request.target.version}`,
    graph_id: request.graph.graph_id,
    target: request.target,
    status,
    nodes,
  };
}
