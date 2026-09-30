import { describe, expect, it } from "vitest";
import type { GoodleIRNode } from "../../ir/GoodleIR";
import { createManifestationTarget } from "../ManifestationGraph";
import { executeManifestationTarget } from "../TargetExecutionRouter";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "./BuiltInRuntimeExecutors";
import { createRuntimeExecutorRegistry } from "./RuntimeExecutorRegistry";

const source: GoodleIRNode = {
  id: "ir-player-hud",
  semantica: "estrutura.interface",
  familia: "estrutura",
};

describe("M10 runtime executors", () => {
  it("materializes a React artifact through the execution router", () => {
    const target = createManifestationTarget(source, "web", "react", "19");
    const result = executeManifestationTarget(target, source, GOODLE_RUNTIME_EXECUTORS_V1);
    expect(result.status).toBe("EXECUTED");
    expect(result.output).toMatchObject({
      artifact_type: "react-component",
      runtime: "react",
      runtime_version: "19",
      source_ir: source.id,
    });
  });

  it("materializes a Phaser artifact through the execution router", () => {
    const target = createManifestationTarget(source, "game", "phaser", "3");
    const result = executeManifestationTarget(target, source, GOODLE_RUNTIME_EXECUTORS_V1);
    expect(result.status).toBe("EXECUTED");
    expect(result.output).toMatchObject({
      artifact_type: "phaser-scene",
      runtime: "phaser",
      runtime_version: "3",
      source_ir: source.id,
      scene_key: "IrPlayerHud",
    });
  });

  it("keeps contract-only targets blocked", () => {
    const target = createManifestationTarget(source, "world", "hnk-verse", "0.1");
    const result = executeManifestationTarget(target, source, GOODLE_RUNTIME_EXECUTORS_V1);
    expect(result.status).toBe("BLOCKED_CONTRACT_ONLY");
  });

  it("rejects duplicate executor keys", () => {
    expect(() => createRuntimeExecutorRegistry([
      { key: "react@19", adapter: "react", version: "19", executor: () => null },
      { key: "react@19", adapter: "react", version: "19", executor: () => null },
    ])).toThrow("DUPLICATE_EXECUTOR: react@19");
  });
});
