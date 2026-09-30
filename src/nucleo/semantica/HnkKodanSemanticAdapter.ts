import type { GoodleIRNode } from "../ir/GoodleIR";

const GOODLE_TO_HNK: Record<string, string> = {
  "estrutura.mundo": "WORLD",
  "estrutura.entidade": "ENTITY",
  "dados.propriedade": "PROPERTY",
  "comportamento.evento": "EVENT",
  "comportamento.acao": "ACTION",
  "comportamento.reacao.quando": "WHEN",
};

export type HnkSemanticProjection = {
  source_semantic_id: string;
  hnk_semantic_id: string;
  equivalence: "direta" | "aproximada" | "contextual" | "com_perda";
  unresolved: boolean;
};

export function projectGoodleNodeToHnk(node: GoodleIRNode): HnkSemanticProjection {
  const hnk = GOODLE_TO_HNK[node.semantica];
  if (!hnk) {
    return {
      source_semantic_id: node.semantica,
      hnk_semantic_id: node.semantica,
      equivalence: "contextual",
      unresolved: true,
    };
  }
  return {
    source_semantic_id: node.semantica,
    hnk_semantic_id: hnk,
    equivalence: "direta",
    unresolved: false,
  };
}

export const GOODLE_TO_HNK_SEMANTIC_IDS = Object.freeze({ ...GOODLE_TO_HNK });
