import type { TargetExecutor } from "../TargetExecutionRouter";

export type ReactArtifact = {
  artifact_type: "react-component";
  runtime: "react";
  runtime_version: "19";
  entry: string;
  source_ir: string;
  component_name: string;
  module_source: string;
};

function safeComponentName(id: string): string {
  const pieces = id.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const joined = pieces.map((piece) => piece[0]?.toUpperCase() + piece.slice(1)).join("");
  const normalized = joined || "GoodleArtifact";
  return /^[0-9]/.test(normalized) ? `Goodle${normalized}` : normalized;
}

export const react19Executor: TargetExecutor = ({ source }) => {
  const componentName = safeComponentName(source.id);
  const semantic = JSON.stringify(source.semantica);
  const family = JSON.stringify(source.familia);

  return {
    artifact_type: "react-component",
    runtime: "react",
    runtime_version: "19",
    entry: "src/generated/GoodleArtifact.tsx",
    source_ir: source.id,
    component_name: componentName,
    module_source:
      `import React from "react";\n\n` +
      `export function ${componentName}() {\n` +
      `  return <main data-goodle-ir=${JSON.stringify(source.id)} data-semantic={${semantic}} data-family={${family}} />;\n` +
      `}\n`,
  } satisfies ReactArtifact;
};
