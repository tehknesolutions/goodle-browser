import type { SemanticGraph } from "../grafo/SemanticGraph";
import type { BuildCertificationV1 } from "../manifestacao/BuildCertification";
import type { BuildReportV1 } from "../manifestacao/BuildReport";
import type { TargetExecutorRegistry } from "../manifestacao/TargetExecutionRouter";
import { sha256Json } from "./BuildLedger";

export type ReproducibleBuildIdentityV1 = {
  schema: "goodle.reproducible-build-identity.v1";
  logical_build_id: string;
  graph_hash: string;
  target_hash: string;
  executor_hash: string;
  artifacts_hash: string;
  certification_hash: string;
  composite_hash: string;
};

export function executorRegistryFingerprint(
  executors: TargetExecutorRegistry,
): string {
  const keys = Object.keys(executors).sort();
  return sha256Json(keys);
}

export function createReproducibleBuildIdentity(input: {
  graph: SemanticGraph;
  report: BuildReportV1;
  certification: BuildCertificationV1;
  executors: TargetExecutorRegistry;
}): ReproducibleBuildIdentityV1 {
  if (input.report.graph_id !== input.graph.graph_id) {
    throw new Error(
      `IDENTITY_GRAPH_ID_MISMATCH: ${input.report.graph_id} != ${input.graph.graph_id}`,
    );
  }

  if (input.report.build_id !== input.certification.build_id) {
    throw new Error(
      `IDENTITY_BUILD_ID_MISMATCH: ${input.report.build_id} != ${input.certification.build_id}`,
    );
  }

  const graph_hash = sha256Json(input.graph);
  const target_hash = sha256Json(input.report.target);
  const executor_hash = executorRegistryFingerprint(input.executors);
  const artifacts_hash = sha256Json(input.report.artifacts);
  const certification_hash = sha256Json(input.certification);

  const composite_hash = sha256Json({
    graph_hash,
    target_hash,
    executor_hash,
    artifacts_hash,
    certification_hash,
  });

  return {
    schema: "goodle.reproducible-build-identity.v1",
    logical_build_id: `rbi-${composite_hash.slice(0, 16)}`,
    graph_hash,
    target_hash,
    executor_hash,
    artifacts_hash,
    certification_hash,
    composite_hash,
  };
}

export function compareReproducibleBuildIdentity(
  previous: ReproducibleBuildIdentityV1,
  current: ReproducibleBuildIdentityV1,
) {
  return {
    equivalent: previous.composite_hash === current.composite_hash,
    graph_drift: previous.graph_hash !== current.graph_hash,
    target_drift: previous.target_hash !== current.target_hash,
    executor_drift: previous.executor_hash !== current.executor_hash,
    artifacts_drift: previous.artifacts_hash !== current.artifacts_hash,
    certification_drift:
      previous.certification_hash !== current.certification_hash,
  };
}
