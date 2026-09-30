import { describe, expect, it } from "vitest";
import { initialStudioExecutionState, reduceStudioExecutionState } from "./StudioExecutionState";

describe("Studio execution state", () => {
  it("moves idle -> running -> success with a manifested artifact", () => {
    const running = reduceStudioExecutionState(initialStudioExecutionState, { type: "started" });
    expect(running.status).toBe("running");
    const success = reduceStudioExecutionState(running, { type: "succeeded", artifactId: "artifact-1" });
    expect(success).toEqual({ status: "success", artifactId: "artifact-1" });
  });

  it("surfaces execution errors without manufacturing an artifact", () => {
    const failed = reduceStudioExecutionState(initialStudioExecutionState, { type: "failed", message: "HNK-VERSE runtime indisponível" });
    expect(failed).toEqual({ status: "error", message: "HNK-VERSE runtime indisponível" });
  });
});
