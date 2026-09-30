import type { TargetExecutionResult } from "./TargetExecutionRouter";

export type MaterializableRuntimeArtifact = {
  artifact_type: string;
  runtime: string;
  runtime_version: string;
  entry: string;
  source_ir: string;
  module_source: string;
};

export type MaterializedFile = {
  path: string;
  content: string;
  media_type: "text/plain" | "application/json" | "text/typescript" | "text/tsx";
  provenance_refs: string[];
};

export type ArtifactManifest = {
  schema: "goodle.artifact-manifest.v1";
  execution_id: string;
  target_id: string;
  source_ir: string;
  adapter: string;
  version: string;
  kind: TargetExecutionResult["kind"];
  entry: string;
  files: string[];
};

export type ArtifactProvenance = {
  schema: "goodle.provenance.v1";
  execution_id: string;
  source_ir: string;
  target_id: string;
  provenance_refs: string[];
};

export type MaterializedArtifactTree = {
  root: string;
  entry: string;
  files: MaterializedFile[];
  manifest: ArtifactManifest;
  provenance: ArtifactProvenance;
};

function asRuntimeArtifact(output: unknown): MaterializableRuntimeArtifact | undefined {
  if (!output || typeof output !== "object") return undefined;
  const value = output as Record<string, unknown>;
  const required = ["artifact_type", "runtime", "runtime_version", "entry", "source_ir", "module_source"];
  if (!required.every((key) => typeof value[key] === "string")) return undefined;
  return value as MaterializableRuntimeArtifact;
}

function mediaTypeFor(path: string): MaterializedFile["media_type"] {
  if (path.endsWith(".tsx")) return "text/tsx";
  if (path.endsWith(".ts")) return "text/typescript";
  if (path.endsWith(".json")) return "application/json";
  return "text/plain";
}

export function materializeExecutionArtifact(
  result: TargetExecutionResult,
  root = ".goodle/generated",
): MaterializedArtifactTree {
  if (result.status !== "EXECUTED") {
    throw new Error(`EXECUTION_NOT_MATERIALIZABLE: ${result.status}`);
  }

  const artifact = asRuntimeArtifact(result.output);
  if (!artifact) {
    throw new Error("INVALID_RUNTIME_ARTIFACT");
  }

  if (artifact.source_ir !== result.source_ir) {
    throw new Error(
      `ARTIFACT_SOURCE_MISMATCH: ${artifact.source_ir} != ${result.source_ir}`,
    );
  }

  const entryPath = artifact.entry.replace(/^\/+/, "");
  const manifestPath = "manifest.json";
  const provenancePath = "provenance.json";

  const manifest: ArtifactManifest = {
    schema: "goodle.artifact-manifest.v1",
    execution_id: result.execution_id,
    target_id: result.target_id,
    source_ir: result.source_ir,
    adapter: result.adapter,
    version: result.version,
    kind: result.kind,
    entry: entryPath,
    files: [entryPath, manifestPath, provenancePath],
  };

  const provenance: ArtifactProvenance = {
    schema: "goodle.provenance.v1",
    execution_id: result.execution_id,
    source_ir: result.source_ir,
    target_id: result.target_id,
    provenance_refs: [...result.provenance_refs],
  };

  const files: MaterializedFile[] = [
    {
      path: entryPath,
      content: artifact.module_source,
      media_type: mediaTypeFor(entryPath),
      provenance_refs: [...result.provenance_refs, result.source_ir],
    },
    {
      path: manifestPath,
      content: JSON.stringify(manifest, null, 2) + "\n",
      media_type: "application/json",
      provenance_refs: [...result.provenance_refs, result.source_ir],
    },
    {
      path: provenancePath,
      content: JSON.stringify(provenance, null, 2) + "\n",
      media_type: "application/json",
      provenance_refs: [...result.provenance_refs, result.source_ir],
    },
  ];

  return {
    root,
    entry: `${root}/${entryPath}`,
    files,
    manifest,
    provenance,
  };
}
