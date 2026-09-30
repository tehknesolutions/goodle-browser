import type { HnkVerseMappingEntry, HnkVerseMappingStatus } from "./HnkVerseMappingRegistry";

export type MappingPromotionEvidence = {
  contractEvidenceRef: string;
  payloadEvidenceRef: string;
  conformanceEvidenceRef: string;
};

export type MappingPromotionResult = {
  allowed: boolean;
  currentStatus: HnkVerseMappingStatus;
  nextStatus: HnkVerseMappingStatus;
  missing: (keyof MappingPromotionEvidence)[];
  evidence: MappingPromotionEvidence;
};

export function validateMappingPromotion(
  mapping: HnkVerseMappingEntry,
  evidence: MappingPromotionEvidence,
): MappingPromotionResult {
  const required: (keyof MappingPromotionEvidence)[] = [
    "contractEvidenceRef",
    "payloadEvidenceRef",
    "conformanceEvidenceRef",
  ];
  const missing = required.filter((key) => evidence[key].trim().length === 0);

  if (mapping.status !== "CANDIDATE") {
    return {
      allowed: false,
      currentStatus: mapping.status,
      nextStatus: mapping.status,
      missing,
      evidence,
    };
  }

  const allowed = missing.length === 0 && Boolean(mapping.nativeCommand);
  return {
    allowed,
    currentStatus: mapping.status,
    nextStatus: allowed ? "VALIDATED" : "CANDIDATE",
    missing,
    evidence,
  };
}
