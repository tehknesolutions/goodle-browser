import type { HnkVerseMappingEntry } from "./HnkVerseMappingRegistry";
import type { MappingPromotionEvidence } from "./HnkVerseMappingValidationGate";

export type MappingEvidenceRecord = {
  mappingId: string;
  sourceKind: HnkVerseMappingEntry["sourceKind"];
  semanticId: string;
  nativeCommand: string;
  mappingVersion: HnkVerseMappingEntry["version"];
  status: "VALIDATED";
  evidence: MappingPromotionEvidence;
  recordedAt: string;
};

export function recordValidatedMapping(mapping: HnkVerseMappingEntry, evidence: MappingPromotionEvidence, recordedAt: string): MappingEvidenceRecord {
  if (mapping.status !== "VALIDATED" || !mapping.nativeCommand) {
    throw new Error("MAPPING_EVIDENCE_REJECTED: mapping must be VALIDATED with nativeCommand");
  }
  const missing = Object.entries(evidence).filter(([, value]) => value.trim().length === 0).map(([key]) => key);
  if (missing.length > 0) throw new Error(`MAPPING_EVIDENCE_REJECTED: missing ${missing.join(",")}`);
  return {
    mappingId: `${mapping.sourceKind}:${mapping.semanticId}`,
    sourceKind: mapping.sourceKind,
    semanticId: mapping.semanticId,
    nativeCommand: mapping.nativeCommand,
    mappingVersion: mapping.version,
    status: "VALIDATED",
    evidence: { ...evidence },
    recordedAt,
  };
}

export function verifyMappingEvidence(record: MappingEvidenceRecord): { valid: boolean; missing: string[] } {
  const missing = Object.entries(record.evidence).filter(([, value]) => value.trim().length === 0).map(([key]) => key);
  return { valid: missing.length === 0, missing };
}
