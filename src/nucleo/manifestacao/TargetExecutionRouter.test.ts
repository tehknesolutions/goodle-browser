import { describe, expect, it } from "vitest";
import type { GoodleIRNode } from "../ir/GoodleIR";
import { createManifestationTarget } from "./ManifestationGraph";
import { executeManifestationTarget } from "./TargetExecutionRouter";

const source: GoodleIRNode = {
  id: "ir-runtime-1",
  semantica: "estrutura.interface",
  familia: "estrutura",
};

describe("Target Execution Router M9", () => {
  it("executes only a runtime-supported target with an explicitly registered executor", () => {
    const target = createManifestationTarget(source, "web", "react", "19");

    const result = executeManifestationTarget(target, source, {
      "react@19": ({ source: node }) => ({ rendered_from: node.id }),
    });

    expect(result).toMatchObject({
      status: "EXECUTED",
      adapter: "react",
      source_ir: "ir-runtime-1",
      output: { rendered_from: "ir-runtime-1" },
    });
  });

  it("does not promote contract evidence to runtime execution", () => {
    const target = createManifestationTarget(source, "world", "hnk-verse", "0.1");

    const result = executeManifestationTarget(target, source, {
      "hnk-verse@0.1": () => ({ should_not_run: true }),
    });

    expect(result).toMatchObject({
      status: "BLOCKED_CONTRACT_ONLY",
      error: "TARGET_HAS_CONTRACT_EVIDENCE_ONLY",
    });
    expect(result.output).toBeUndefined();
  });

  it("blocks unsupported targets", () => {
    const target = createManifestationTarget(source, "video", "react", "19");

    expect(executeManifestationTarget(target, source, {})).toMatchObject({
      status: "BLOCKED_UNSUPPORTED",
      error: "UNSUPPORTED_KIND",
    });
  });

  it("blocks runtime targets when no executor is registered", () => {
    const target = createManifestationTarget(source, "game", "phaser", "3");

    expect(executeManifestationTarget(target, source, {})).toMatchObject({
      status: "BLOCKED_NO_EXECUTOR",
      error: "NO_EXECUTOR_REGISTERED",
    });
  });

  it("rejects source identity mismatch", () => {
    const target = createManifestationTarget(source, "web", "react", "19");
    const other = { ...source, id: "ir-other" };

    expect(executeManifestationTarget(target, other, {
      "react@19": () => ({ ok: true }),
    })).toMatchObject({
      status: "FAILED",
      error: "SOURCE_IR_MISMATCH: ir-runtime-1 != ir-other",
    });
  });

  it("captures executor failures without losing execution provenance", () => {
    const target = createManifestationTarget(source, "web", "react", "19");

    const result = executeManifestationTarget(target, source, {
      "react@19": () => {
        throw new Error("adapter failure");
      },
    });

    expect(result).toMatchObject({
      status: "FAILED",
      target_id: target.target_id,
      source_ir: source.id,
      error: "adapter failure",
    });
    expect(result.provenance_refs).toContain(source.id);
  });
});
