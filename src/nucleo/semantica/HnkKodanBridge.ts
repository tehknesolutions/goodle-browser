export type HnkAuthorityState =
  | "OBSERVED"
  | "DERIVED"
  | "HYPOTHESIS"
  | "CANDIDATE"
  | "VALIDATED"
  | "CANONICAL"
  | "UNRESOLVED"
  | "DISCOVERY_NON_CANONICAL";

export type HnkCanonicalConcept = {
  lexeme: string;
  concept: string;
  ptBR: string;
  en: string;
  glyphId: string;
  authority: "CANONICAL";
  source: {
    repository: "tehknesolutions/HNK-KODE";
    ref: "main";
  };
};

export const HNK_KODE_CANONICAL_CONCEPTS: readonly HnkCanonicalConcept[] = [
  { lexeme: "AHNUVA", concept: "AMOR", ptBR: "amor", en: "love", glyphId: "HNK-LG-0001", authority: "CANONICAL", source: { repository: "tehknesolutions/HNK-KODE", ref: "main" } },
  { lexeme: "EMANU", concept: "VERDADE", ptBR: "verdade", en: "truth", glyphId: "HNK-LG-0002", authority: "CANONICAL", source: { repository: "tehknesolutions/HNK-KODE", ref: "main" } },
  { lexeme: "HAYA", concept: "VIDA", ptBR: "vida", en: "life", glyphId: "HNK-LG-0003", authority: "CANONICAL", source: { repository: "tehknesolutions/HNK-KODE", ref: "main" } },
  { lexeme: "HODERU", concept: "CAMINHO", ptBR: "caminho", en: "way", glyphId: "HNK-LG-0004", authority: "CANONICAL", source: { repository: "tehknesolutions/HNK-KODE", ref: "main" } },
  { lexeme: "KODAN", concept: "LOGOS", ptBR: "logos", en: "logos", glyphId: "HNK-LG-0005", authority: "CANONICAL", source: { repository: "tehknesolutions/HNK-KODE", ref: "main" } },
];

export function resolveCanonicalHnkLexeme(lexeme: string): HnkCanonicalConcept | undefined {
  const normalized = lexeme.trim().toLocaleUpperCase("pt-BR");
  return HNK_KODE_CANONICAL_CONCEPTS.find((item) => item.lexeme === normalized);
}

export function isCanonicalHnkLexeme(lexeme: string): boolean {
  return Boolean(resolveCanonicalHnkLexeme(lexeme));
}

export function requireCanonicalHnkLexeme(lexeme: string): HnkCanonicalConcept {
  const resolved = resolveCanonicalHnkLexeme(lexeme);
  if (!resolved) {
    throw new Error(
      `HNK lexeme "${lexeme}" is unresolved in the Goodle HNK-KODE bridge; no HNK term may be invented.`,
    );
  }
  return resolved;
}
