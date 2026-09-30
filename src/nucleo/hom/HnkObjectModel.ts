import type { AuthorityState } from "../contratos/HnkEcosystemContracts";
import type { SemanticGraph, SemanticNode, SemanticRelationKind } from "../grafo/SemanticGraph";

export type HomRelation = {
  id: string;
  source: string;
  target: string;
  relation: SemanticRelationKind;
  authority: AuthorityState;
  provenance_refs: string[];
};

export type HomObject = {
  id: string;
  semantic_id: string;
  authority: AuthorityState;
  state: Record<string, unknown>;
  components: string[];
  relations: HomRelation[];
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
  relations: HomRelation[];
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
  const relations: HomRelation[] = graph.relations.map((relation) => ({
    id: relation.id,
    source: relation.source,
    target: relation.target,
    relation: relation.relation,
    authority: relation.authority,
    provenance_refs: [...relation.provenance_refs],
  }));

  for (const relation of relations) {
    const source = byId.get(relation.source);
    if (!source) continue;
    source.relations.push(relation);
    if (relation.relation === "contains") source.components.push(relation.target);
    if (relation.relation === "triggers") source.events.push(relation.target);
    if (relation.relation === "manifests") source.manifestations.push(relation.target);
    if (relation.relation === "defines") source.data[`defines:${relation.target}`] = true;
  }
  return { schema: "hnk-hom/v0.1", graph_ref: graph.graph_id, objects, relations };
}
