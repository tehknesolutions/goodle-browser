import type { AuthorityState } from "../contratos/HnkEcosystemContracts";
import type { HnkObjectModel } from "../hom/HnkObjectModel";

export type HnkIRKind = "WORLD" | "ENTITY" | "PROPERTY" | "EVENT" | "ACTION" | "UNRESOLVED";

export type HnkIRNode = {
  id: string;
  kind: HnkIRKind;
  semantic_id: string;
  authority: AuthorityState;
  payload: Record<string, unknown>;
  provenance_refs: string[];
};

export type HnkIRProgram = {
  schema: "hnk-ir/goodle-v0.1";
  hom_ref: string;
  nodes: HnkIRNode[];
};

const classify = (semanticId: string): HnkIRKind => {
  const normalized = semanticId.toUpperCase();
  if (normalized.includes("WORLD") || normalized === "ESTRUTURA.MUNDO") return "WORLD";
  if (normalized.includes("ENTITY") || normalized === "ESTRUTURA.ENTIDADE") return "ENTITY";
  if (normalized.includes("PROPERTY") || normalized === "DADOS.PROPRIEDADE") return "PROPERTY";
  if (normalized.includes("EVENT") || normalized === "COMPORTAMENTO.EVENTO") return "EVENT";
  if (normalized.includes("ACTION") || normalized === "COMPORTAMENTO.ACAO") return "ACTION";
  return "UNRESOLVED";
};

export function homToHnkIR(hom: HnkObjectModel): HnkIRProgram {
  return {
    schema: "hnk-ir/goodle-v0.1",
    hom_ref: hom.graph_ref,
    nodes: hom.objects.map((object) => ({
      id: object.id,
      kind: classify(object.semantic_id),
      semantic_id: object.semantic_id,
      authority: object.authority,
      payload: {
        state: object.state,
        components: object.components,
        relations: object.relations,
        behaviors: object.behaviors,
        events: object.events,
        data: object.data,
        manifestations: object.manifestations,
      },
      provenance_refs: [...object.provenance_refs],
    })),
  };
}
