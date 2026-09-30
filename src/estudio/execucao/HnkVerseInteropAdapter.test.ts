import { describe, expect, it } from "vitest";
import { buildHnkVerseInteropRequest, requireTranslatedInterop } from "./HnkVerseInteropAdapter";

const request = {
  request_id: "exec-1",
  principal: { canonical_id: "agent:goodle", actor_type: "agent" as const },
  runtime: { canonical_id: "service:hnk-verse", actor_type: "service" as const },
  plan: { schema: "goodle-hnk-verse-plan/v0.1" as const, source_hnkir: "hnkir-1", operations: [], relations: [], unresolved: [] },
  intent_ref: "intent-1",
  project_ref: "project-1",
  requested_at: "2026-09-30T14:00:00Z",
};

describe("HNK-VERSE official interop boundary", () => {
  it("requests TRANSLATE instead of pretending the Goodle plan is native HNK-VERSE", () => {
    expect(buildHnkVerseInteropRequest(request)).toMatchObject({
      sourceRef: "hnkir-1",
      sourceAuthority: "goodle-browser",
      targetContextRef: "service:hnk-verse",
      contractVersion: "goodle-hnk-verse-interop/v0.1",
      outcome: "TRANSLATE",
      mapperRef: "goodle-hnkir-to-hnk-verse/v0.1",
    });
  });

  it("rejects interop outcomes that did not produce a translated native result", () => {
    expect(() => requireTranslatedInterop({ kind: "REJECT", reason: "TRANSLATION_MAPPER_REQUIRED" })).toThrow("HNK_VERSE_INTEROP_REJECTED");
    expect(requireTranslatedInterop({ kind: "TRANSLATE", sourceRef: "hnkir-1", resultRef: "native-1", mapperRef: "mapper-1" })).toBe("native-1");
  });
});
