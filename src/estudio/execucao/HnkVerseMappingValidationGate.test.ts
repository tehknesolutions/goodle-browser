import { describe, expect, it } from "vitest";
import { validateMappingPromotion } from "./HnkVerseMappingValidationGate";

const candidate = {
  sourceKind: "ACTION" as const,
  semanticId: "comportamento.movimento",
  nativeCommand: "MoveEntity",
  requiredPayload: ["sourceKind", "semanticId", "sourceRef", "data"] as const,
  version: "goodle-hnkir-to-hnk-verse/v0.1" as const,
  status: "CANDIDATE" as const,
  rationale: "Candidate movement mapping.",
};

describe("HNK-VERSE Mapping Validation Gate", () => {
  it("allows promotion only with contract, payload and conformance evidence", () => {
    expect(validateMappingPromotion(candidate, {
      contractEvidenceRef: "hnk-verse:contracts:HnkCommand:MoveEntity",
      payloadEvidenceRef: "test:move-entity-payload",
      conformanceEvidenceRef: "test:goodle-hnkir-move-entity",
    })).toMatchObject({ allowed: true, nextStatus: "VALIDATED" });
  });

  it("rejects promotion when any required evidence is missing", () => {
    expect(validateMappingPromotion(candidate, {
      contractEvidenceRef: "hnk-verse:contracts:HnkCommand:MoveEntity",
      payloadEvidenceRef: "",
      conformanceEvidenceRef: "test:goodle-hnkir-move-entity",
    })).toMatchObject({ allowed: false, nextStatus: "CANDIDATE", missing: ["payloadEvidenceRef"] });
  });

  it("does not promote unresolved mappings directly", () => {
    expect(validateMappingPromotion({ ...candidate, status: "UNRESOLVED" }, {
      contractEvidenceRef: "contract",
      payloadEvidenceRef: "payload",
      conformanceEvidenceRef: "conformance",
    })).toMatchObject({ allowed: false, nextStatus: "UNRESOLVED" });
  });
});
