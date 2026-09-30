import { HNK_KODE_CANONICAL_CONCEPTS } from "./HnkKodanBridge";

export type LanguageProfile = "HNK" | "PT-BR" | "EN";

export type SemanticToken = {
  semantic_id: string;
  profile: LanguageProfile;
  surface: string;
  authority: "CANONICAL" | "UNRESOLVED";
};

const canonicalByConcept: Record<string, string> = {
  AMOR: "LOVE",
  VERDADE: "TRUTH",
  VIDA: "LIFE",
  CAMINHO: "WAY",
  LOGOS: "LOGOS",
};

export function resolveLanguageSurface(
  semanticId: string,
  profile: LanguageProfile,
): SemanticToken {
  const concept = Object.entries(canonicalByConcept).find(([, id]) => id === semanticId)?.[0];
  if (!concept) return { semantic_id: semanticId, profile, surface: semanticId, authority: "UNRESOLVED" };
  const item = HNK_KODE_CANONICAL_CONCEPTS.find((x) => x.concept === concept);
  if (!item) return { semantic_id: semanticId, profile, surface: semanticId, authority: "UNRESOLVED" };
  const surface = profile === "HNK" ? item.lexeme : profile === "PT-BR" ? item.ptBR : item.en;
  return { semantic_id: semanticId, profile, surface, authority: "CANONICAL" };
}
