import type { AuthorityState, ProvenanceRecord } from "../contratos/HnkEcosystemContracts";

export type SemanticNodeKind =
  | "intent"
  | "structure"
  | "data"
  | "behavior"
  | "knowledge"
  | "manifestation";

export type SemanticRelationKind =
  | "contains"
  | "defines"
  | "reads"
  | "writes"
  | "triggers"
  | "transforms"
  | "manifests"
  | "references";

export type SemanticNode = {
  id: string;
  semantic_id: string;
  kind: SemanticNodeKind;
  label?: string;
  authority: AuthorityState;
  provenance_refs: string[];
  attributes: Record<string, unknown>;
};

export type SemanticRelation = {
  id: string;
  source: string;
  target: string;
  relation: SemanticRelationKind;
  authority: AuthorityState;
  provenance_refs: string[];
};

export type SemanticGraph = {
  schema: "goodle-semantic-graph/v0.2";
  graph_id: string;
  intent_ref?: string;
  project_ref?: string;
  nodes: SemanticNode[];
  relations: SemanticRelation[];
  provenance: ProvenanceRecord[];
};

export function createSemanticGraph(graphId: string): SemanticGraph {
  return {
    schema: "goodle-semantic-graph/v0.2",
    graph_id: graphId,
    nodes: [],
    relations: [],
    provenance: [],
  };
}

export function addSemanticNode(graph: SemanticGraph, node: SemanticNode): SemanticGraph {
  if (graph.nodes.some((candidate) => candidate.id === node.id)) {
    throw new Error(`Semantic node already exists: ${node.id}`);
  }
  return { ...graph, nodes: [...graph.nodes, node] };
}

export function addSemanticRelation(graph: SemanticGraph, relation: SemanticRelation): SemanticGraph {
  const sourceExists = graph.nodes.some((node) => node.id === relation.source);
  const targetExists = graph.nodes.some((node) => node.id === relation.target);
  if (!sourceExists || !targetExists) {
    throw new Error(`UNRESOLVED semantic relation endpoints: ${relation.id}`);
  }
  return { ...graph, relations: [...graph.relations, relation] };
}
