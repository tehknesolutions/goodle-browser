import type { HnkIRNodeKind } from "../../nucleo/hnkir/HnkIR";

export type HnkVerseMappingStatus = "VALIDATED" | "CANDIDATE" | "UNRESOLVED";

export type HnkVerseMappingEntry = {
  sourceKind: HnkIRNodeKind;
  semanticId: string;
  nativeCommand: string | null;
  requiredPayload: readonly string[];
  version: "goodle-hnkir-to-hnk-verse/v0.1";
  status: HnkVerseMappingStatus;
  rationale: string;
};

export const HNK_VERSE_MAPPING_REGISTRY: readonly HnkVerseMappingEntry[] = [
  {
    sourceKind: "ENTITY",
    semanticId: "estrutura.entidade",
    nativeCommand: "CraftEntity",
    requiredPayload: ["sourceKind", "semanticId", "sourceRef", "sourceAuthority", "provenanceRefs", "data"],
    version: "goodle-hnkir-to-hnk-verse/v0.1",
    status: "VALIDATED",
    rationale: "CraftEntity is an official HNK-VERSE command and is the confirmed v0.1 manifestation boundary for Goodle ENTITY nodes.",
  },
  ...(["WORLD", "PROPERTY", "EVENT", "ACTION"] as const).map((sourceKind) => ({
    sourceKind,
    semanticId: "*",
    nativeCommand: null,
    requiredPayload: [] as readonly string[],
    version: "goodle-hnkir-to-hnk-verse/v0.1" as const,
    status: "UNRESOLVED" as const,
    rationale: "No semantically exact native command binding has been approved for this Goodle HNK-IR kind.",
  })),
] as const;

export function resolveHnkVerseMapping(sourceKind: HnkIRNodeKind, semanticId: string): HnkVerseMappingEntry {
  return HNK_VERSE_MAPPING_REGISTRY.find((entry) => entry.sourceKind === sourceKind && entry.semanticId === semanticId)
    ?? HNK_VERSE_MAPPING_REGISTRY.find((entry) => entry.sourceKind === sourceKind && entry.semanticId === "*")
    ?? {
      sourceKind,
      semanticId,
      nativeCommand: null,
      requiredPayload: [],
      version: "goodle-hnkir-to-hnk-verse/v0.1",
      status: "UNRESOLVED",
      rationale: "No mapping registry entry exists for this semantic binding.",
    };
}
