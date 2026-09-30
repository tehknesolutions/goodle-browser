import { describe, expect, it } from "vitest";
import { createArtifactBundle } from "./ArtifactContract";
import type { VerseExecutionRequest, VerseExecutionReceipt } from "../verse/HnkVerseExecutionContract";

const request: VerseExecutionRequest = {
  request_id: "exec-world-1",
  principal: { canonical_id: "agent:goodle", actor_type: "agent" },
  runtime: { canonical_id: "service:hnk-verse", actor_type: "service" },
  plan: {
    schema: "goodle-hnk-verse-plan/v0.1",
    source_hnkir: "hom-world",
    operations: [{ operation_id: "verse-world", operation: "world", source_ir: "world", payload: {}, provenance_refs: ["intent-world"] }],
    relations: [],
    unresolved: [],
  },
  intent_ref: "intent-world",
  project_ref: "project-goodle",
  requested_at: "2026-09-30T11:00:00Z",
};

const executed: VerseExecutionReceipt = {
  request_id: request.request_id,
  runtime: request.runtime,
  status: "executed",
  accepted_operations: ["verse-world"],
  rejected_operations: [],
  executed_at: "2026-09-30T11:00:01Z",
};

describe("Artifact Contract", () => {
  it("links manifested artifact back to execution, intent and operations", () => {
    const bundle = createArtifactBundle(request, executed, {
      artifact_id: "artifact-world-1",
      kind: "world",
      created_at: "2026-09-30T11:00:02Z",
      uri: "hnk-verse://world/world-1",
      digest: "sha256:example",
    });
    expect(bundle.artifact).toMatchObject({ execution_ref: "exec-world-1", intent_ref: "intent-world", authority: "OBSERVED" });
    expect(bundle.artifact.source_operation_refs).toEqual(["verse-world"]);
    expect(bundle.evidence.truth_assessed).toBe(false);
    expect(bundle.provenance.parent_refs).toContain("exec-world-1");
  });

  it("does not create an artifact from an unexecuted receipt", () => {
    expect(() => createArtifactBundle(request, { ...executed, status: "accepted" }, {
      artifact_id: "artifact-invalid",
      kind: "world",
      created_at: "2026-09-30T11:00:02Z",
    })).toThrow("ARTIFACT_REJECTED");
  });
});
