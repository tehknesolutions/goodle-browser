import { describe, expect, it } from "vitest";
import { recordValidatedMapping, verifyMappingEvidence } from "./HnkVerseMappingEvidenceLedger";

const mapping = {
  sourceKind: "ENTITY" as const,
  semanticId: "estrutura.entidade",
  nativeCommand: "CraftEntity",
  requiredPayload: ["sourceKind", "semanticId", "sourceRef", "sourceAuthority", "provenanceRefs", "data"] as const,
  version: "goodle-hnkir-to-hnk-verse/v0.1" as const,
  status: "VALIDATED" as const,
  rationale: "Validated entity manifestation mapping.",
};

const evidence = {
  contractEvidenceRef: "hnk-verse:contracts:HnkCommand:CraftEntity",
  payloadEvidenceRef: "test:craft-entity-payload",
  conformanceEvidenceRef: "test:goodle-hnkir-craft-entity",
};

describe("HNK-VERSE mapping evidence ledger", () => {
  it("records the evidence genealogy of a validated mapping", () => {
    const record = recordValidatedMapping(mapping, evidence, "2026-09-30T11:30:00Z");
    expect(record).toMatchObject({ mappingId: "ENTITY:estrutura.entidade", nativeCommand: "CraftEntity", status: "VALIDATED", mappingVersion: "goodle-hnkir-to-hnk-verse/v0.1" });
    expect(verifyMappingEvidence(record)).toEqual({ valid: true, missing: [] });
  });

  it("rejects ledger creation for mappings that are not validated", () => {
    expect(() => recordValidatedMapping({ ...mapping, status: "CANDIDATE" }, evidence, "2026-09-30T11:30:00Z")).toThrow("MAPPING_EVIDENCE_REJECTED");
  });
});
