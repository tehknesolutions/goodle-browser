import type { GoodleIRNode, GoodleIRPrograma, FamiliaIR } from "../ir/GoodleIR";
import { createManifestationTarget, type ManifestationKind, type ManifestationTarget } from "../manifestacao/ManifestationGraph";
import { projectGoodleNodeToHnk, type HnkSemanticProjection } from "../semantica/HnkKodanSemanticAdapter";
import type { IntentEnvelope } from "../contratos/HnkEcosystemContracts";
import type { SemanticGraph, SemanticNode } from "./SemanticGraph";

const KIND_TO_IR_FAMILY: Record<SemanticNode["kind"], FamiliaIR> = {
  intent: "execucao",
  structure: "estrutura",
  data: "dados",
  behavior: "comportamento",
  knowledge: "dados",
  manifestation: "execucao",
};

export type SemanticPipelineResult = {
  intent_ref?: string;
  semantic_graph_ref: string;
  ir: GoodleIRPrograma;
  hnk: HnkSemanticProjection[];
  manifestations: ManifestationTarget[];
};

export function semanticNodeToGoodleIR(node: SemanticNode): GoodleIRNode {
  return {
    id: node.id,
    semantica: node.semantic_id,
    familia: KIND_TO_IR_FAMILY[node.kind],
    parametros: { ...node.attributes },
    metadados: {
      authority: node.authority,
      provenance_refs: [...node.provenance_refs],
      semantic_graph_node: node.id,
    },
  };
}

export function semanticGraphToGoodleIR(graph: SemanticGraph): GoodleIRPrograma {
  return {
    versao: "1",
    nos: graph.nodes.map(semanticNodeToGoodleIR),
  };
}

export function executeSemanticPipeline(
  graph: SemanticGraph,
  options: {
    intent?: IntentEnvelope;
    manifestation?: { kind: ManifestationKind; adapter: string; version: string };
  } = {},
): SemanticPipelineResult {
  if (options.intent && graph.intent_ref && graph.intent_ref !== options.intent.intent_id) {
    throw new Error(`Intent mismatch: ${graph.intent_ref} != ${options.intent.intent_id}`);
  }

  const ir = semanticGraphToGoodleIR(graph);
  const hnk = ir.nos.map(projectGoodleNodeToHnk);
  const manifestations = options.manifestation
    ? ir.nos.map((node) => createManifestationTarget(
        node,
        options.manifestation!.kind,
        options.manifestation!.adapter,
        options.manifestation!.version,
      ))
    : [];

  return {
    intent_ref: graph.intent_ref ?? options.intent?.intent_id,
    semantic_graph_ref: graph.graph_id,
    ir,
    hnk,
    manifestations,
  };
}
