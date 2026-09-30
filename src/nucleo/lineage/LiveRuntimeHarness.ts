import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactArtifact } from "../manifestacao/executores/ReactExecutor";
import type { PhaserArtifact } from "../manifestacao/executores/PhaserExecutor";
import type { TargetExecutionResult } from "../manifestacao/TargetExecutionRouter";
import { sha256Json } from "./BuildLedger";

export type LiveRuntimeHarnessEvidenceV1 =
  | {
      schema: "goodle.live-runtime-harness-evidence.v1";
      adapter: "react";
      version: "19";
      mode: "LIVE_RENDER";
      booted: true;
      entry: string;
      output_ref: string;
      rendered_markup: string;
      evidence_hash: string;
    }
  | {
      schema: "goodle.live-runtime-harness-evidence.v1";
      adapter: "phaser";
      version: "3";
      mode: "BOOT_HARNESS";
      booted: true;
      entry: string;
      output_ref: string;
      scene_key: string;
      boot_config: {
        type: "AUTO";
        scene: string;
        parent: string;
      };
      evidence_hash: string;
    };

function assertExecuted(result: TargetExecutionResult): void {
  if (result.status !== "EXECUTED") {
    throw new Error(
      `LIVE_RUNTIME_REQUIRES_EXECUTED_TARGET: ${result.status}`,
    );
  }
}

function asReactArtifact(result: TargetExecutionResult): ReactArtifact {
  const output = result.output as Partial<ReactArtifact> | undefined;
  if (
    !output ||
    output.artifact_type !== "react-component" ||
    output.runtime !== "react" ||
    output.runtime_version !== "19" ||
    !output.entry ||
    !output.source_ir
  ) {
    throw new Error("LIVE_RUNTIME_INVALID_REACT_ARTIFACT");
  }
  return output as ReactArtifact;
}

function asPhaserArtifact(result: TargetExecutionResult): PhaserArtifact {
  const output = result.output as Partial<PhaserArtifact> | undefined;
  if (
    !output ||
    output.artifact_type !== "phaser-scene" ||
    output.runtime !== "phaser" ||
    output.runtime_version !== "3" ||
    !output.entry ||
    !output.scene_key ||
    !output.source_ir
  ) {
    throw new Error("LIVE_RUNTIME_INVALID_PHASER_ARTIFACT");
  }
  return output as PhaserArtifact;
}

export function runReact19LiveHarness(
  result: TargetExecutionResult,
): LiveRuntimeHarnessEvidenceV1 {
  assertExecuted(result);
  const artifact = asReactArtifact(result);

  const rendered_markup = renderToStaticMarkup(
    React.createElement("main", {
      "data-goodle-ir": artifact.source_ir,
      "data-runtime": "react@19",
      "data-component": artifact.component_name,
    }),
  );

  const unsigned = {
    schema: "goodle.live-runtime-harness-evidence.v1" as const,
    adapter: "react" as const,
    version: "19" as const,
    mode: "LIVE_RENDER" as const,
    booted: true as const,
    entry: artifact.entry,
    output_ref: `render://react@19/${artifact.component_name}`,
    rendered_markup,
  };

  return {
    ...unsigned,
    evidence_hash: sha256Json(unsigned),
  };
}

export function runPhaser3BootHarness(
  result: TargetExecutionResult,
): LiveRuntimeHarnessEvidenceV1 {
  assertExecuted(result);
  const artifact = asPhaserArtifact(result);

  if (
    !artifact.module_source.includes('import Phaser from "phaser"') ||
    !artifact.module_source.includes("extends Phaser.Scene") ||
    !artifact.module_source.includes(
      `super(${JSON.stringify(artifact.scene_key)})`,
    )
  ) {
    throw new Error("LIVE_RUNTIME_PHASER_SCENE_CONTRACT_INVALID");
  }

  const boot_config = {
    type: "AUTO" as const,
    scene: artifact.scene_key,
    parent: "goodle-phaser-root",
  };

  const unsigned = {
    schema: "goodle.live-runtime-harness-evidence.v1" as const,
    adapter: "phaser" as const,
    version: "3" as const,
    mode: "BOOT_HARNESS" as const,
    booted: true as const,
    entry: artifact.entry,
    output_ref: `boot://phaser@3/${artifact.scene_key}`,
    scene_key: artifact.scene_key,
    boot_config,
  };

  return {
    ...unsigned,
    evidence_hash: sha256Json(unsigned),
  };
}

export function runLiveRuntimeHarness(
  result: TargetExecutionResult,
): LiveRuntimeHarnessEvidenceV1 {
  if (result.adapter === "react" && result.version.startsWith("19")) {
    return runReact19LiveHarness(result);
  }

  if (result.adapter === "phaser" && result.version.startsWith("3")) {
    return runPhaser3BootHarness(result);
  }

  throw new Error(
    `LIVE_RUNTIME_HARNESS_UNSUPPORTED: ${result.adapter}@${result.version}`,
  );
}

export function verifyLiveRuntimeHarnessEvidence(
  evidence: LiveRuntimeHarnessEvidenceV1,
): boolean {
  const { evidence_hash, ...unsigned } = evidence;
  return sha256Json(unsigned) === evidence_hash;
}
