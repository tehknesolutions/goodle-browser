import { describe, expect, it } from "vitest";
import type { GoodleIRNode } from "../ir/GoodleIR";
import { createManifestationTarget } from "./ManifestationGraph";
import { materializeExecutionArtifact } from "./ArtifactMaterializer";
import { executeManifestationTarget } from "./TargetExecutionRouter";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "./executores";

const source: GoodleIRNode = {
  id: "ir-materialized-ui",
  semantica: "estrutura.interface",
  familia: "estrutura",
};

describe("M11 Artifact Materializer", () => {
  it("materializes React execution into a concrete file tree", () => {
    const target = createManifestationTarget(source, "web", "react", "19");
    const execution = executeManifestationTarget(
      target,
      source,
      GOODLE_RUNTIME_EXECUTORS_V1,
    );

    const tree = materializeExecutionArtifact(execution);

    expect(tree.entry).toBe(".goodle/generated/src/generated/GoodleArtifact.tsx");
    expect(tree.files.map((file) => file.path)).toEqual([
      "src/generated/GoodleArtifact.tsx",
      "manifest.json",
      "provenance.json",
    ]);
    expect(tree.manifest).toMatchObject({
      schema: "goodle.artifact-manifest.v1",
      adapter: "react",
      source_ir: source.id,
    });
    expect(tree.provenance.provenance_refs).toContain(source.id);
  });

  it("materializes Phaser execution preserving source identity", () => {
    const target = createManifestationTarget(source, "game", "phaser", "3");
    const execution = executeManifestationTarget(
      target,
      source,
      GOODLE_RUNTIME_EXECUTORS_V1,
    );

    const tree = materializeExecutionArtifact(execution, "dist/goodle");

    expect(tree.entry).toBe("dist/goodle/src/generated/GoodleScene.ts");
    expect(tree.manifest.adapter).toBe("phaser");
    expect(tree.files[0]?.content).toContain("extends Phaser.Scene");
  });

  it("rejects blocked executions", () => {
    const target = createManifestationTarget(source, "world", "hnk-verse", "0.1");
    const execution = executeManifestationTarget(
      target,
      source,
      GOODLE_RUNTIME_EXECUTORS_V1,
    );

    expect(() => materializeExecutionArtifact(execution)).toThrow(
      "EXECUTION_NOT_MATERIALIZABLE: BLOCKED_CONTRACT_ONLY",
    );
  });

  it("rejects malformed runtime artifacts", () => {
    expect(() =>
      materializeExecutionArtifact({
        execution_id: "exec-invalid",
        target_id: "manifest-invalid",
        source_ir: source.id,
        status: "EXECUTED",
        adapter: "react",
        version: "19",
        kind: "web",
        capability_refs: [],
        provenance_refs: [source.id],
        output: { artifact_type: "react-component" },
      }),
    ).toThrow("INVALID_RUNTIME_ARTIFACT");
  });
});
