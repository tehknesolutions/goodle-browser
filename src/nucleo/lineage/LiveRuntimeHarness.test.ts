import { describe, expect, it } from "vitest";
import { createManifestationTarget } from "../manifestacao/ManifestationGraph";
import type { GoodleIRNode } from "../ir/GoodleIR";
import { executeManifestationTarget } from "../manifestacao/TargetExecutionRouter";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "../manifestacao/executores/BuiltInRuntimeExecutors";
import {
  runLiveRuntimeHarness,
  verifyLiveRuntimeHarnessEvidence,
} from "./LiveRuntimeHarness";

function node(id: string): GoodleIRNode {
  return {
    id,
    semantica: "live harness",
    familia: "estrutura",
  };
}

describe("M42 Live Runtime Harness", () => {
  it("renders a React 19 target through the real React renderer", () => {
    const source = node("live-react");
    const target = createManifestationTarget(source, "web", "react", "19");
    const execution = executeManifestationTarget(
      target,
      source,
      GOODLE_RUNTIME_EXECUTORS_V1,
    );

    const evidence = runLiveRuntimeHarness(execution);

    expect(evidence).toMatchObject({
      adapter: "react",
      version: "19",
      mode: "LIVE_RENDER",
      booted: true,
      entry: "src/generated/GoodleArtifact.tsx",
    });
    if (evidence.adapter === "react") {
      expect(evidence.rendered_markup).toContain('data-goodle-ir="live-react"');
      expect(evidence.rendered_markup).toContain('data-runtime="react@19"');
    }
    expect(verifyLiveRuntimeHarnessEvidence(evidence)).toBe(true);
  });

  it("produces a verified Phaser 3 boot harness from the concrete scene", () => {
    const source = node("live-phaser");
    const target = createManifestationTarget(source, "game", "phaser", "3");
    const execution = executeManifestationTarget(
      target,
      source,
      GOODLE_RUNTIME_EXECUTORS_V1,
    );

    const evidence = runLiveRuntimeHarness(execution);

    expect(evidence).toMatchObject({
      adapter: "phaser",
      version: "3",
      mode: "BOOT_HARNESS",
      booted: true,
      entry: "src/generated/GoodleScene.ts",
    });
    if (evidence.adapter === "phaser") {
      expect(evidence.boot_config).toEqual({
        type: "AUTO",
        scene: "LivePhaser",
        parent: "goodle-phaser-root",
      });
    }
    expect(verifyLiveRuntimeHarnessEvidence(evidence)).toBe(true);
  });

  it("refuses a non-executed target", () => {
    const source = node("contract-only");
    const target = createManifestationTarget(
      source,
      "web",
      "react-phaser",
      "1",
    );
    const execution = executeManifestationTarget(
      target,
      source,
      GOODLE_RUNTIME_EXECUTORS_V1,
    );

    expect(() => runLiveRuntimeHarness(execution)).toThrow(
      "LIVE_RUNTIME_REQUIRES_EXECUTED_TARGET",
    );
  });
});
