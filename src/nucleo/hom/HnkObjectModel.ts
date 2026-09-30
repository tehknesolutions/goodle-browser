import type { AuthorityState } from "../contratos/HnkEcosystemContracts";
import type { SemanticGraph, SemanticNode } from "../grafo/SemanticGraph";

export type HomObject = {
  id: string;
  semantic_id: string;
  authority: AuthorityState;
  state: Record<string, unknown>;
  components: string[];
  relations: string[];
  behaviors: string[];
  events: string[];
  narrative?: string;
  assets: string[];
  presentation: Record<string, unknown>;
  data: Record<string, unknown>;
  manifestations: string[];
  provenance_refs: string[];
};

export type HnkObjectModel = {
  schema: "hnk-hom/v0.1";
  graph_ref: string;
  objects: HomObject[];
};

function nodeToHom(node: SemanticNode): HomObject {
  return {
    id: node.id,
    semantic_id: node.semantic_id,
    authority: node.authority,
    state: {},
    components: [],
    relations: [],
    behaviors: [],
    events: [],
    assets: [],
    presentation: {},
    data: { ...node.attributes },
    manifestations: [],
    provenance_refs: [...node.provenance_refs],
  };
}

export function semanticGraphToHom(graph: SemanticGraph): HnkObjectModel {
  const objects = graph.nodes.map(nodeToHom);
  const byId = new Map(objects.map((object) => [object.id, object]));
  for (const relation of graph.relations) {
    const source = byId.get(relation.source);
    if (!source) continue;
    source.relations.push(relation.id);
    if (relation.relation === "contains") source.components.push(relation.target);
    if (relation.relation === "triggers") source.events.push(relation.target);
    if (relation.relation === "manifests") source.manifestations.push(relation.target);
  }
  return { schema: "hnk-hom/v0.1", graph_ref: graph.graph_id, objects };
}
