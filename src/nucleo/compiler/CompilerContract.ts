import type { GoodleIRNode, GoodleIRPrograma } from "../ir/GoodleIR";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { addSemanticNode, addSemanticRelation, createSemanticGraph, type SemanticGraph, type SemanticNodeKind } from "../grafo/SemanticGraph";

export type CompilerDiagnostic = {
  severity: "error" | "warning";
  code: string;
  message: string;
  line?: number;
};

export type CompilerResult = {
  source: "oldrewrite";
  ir?: GoodleIRPrograma;
  semantic_graph?: SemanticGraph;
  diagnostics: CompilerDiagnostic[];
  executable: boolean;
};

const semanticKind = (node: GoodleIRNode): SemanticNodeKind => {
  if (node.dominio === "dados") return "data";
  if (node.dominio === "comportamento") return "behavior";
  if (node.dominio === "mundo") return "structure";
  return "structure";
};

const semanticId = (node: GoodleIRNode): string | undefined => {
  const s = node.semantica;
  if (s.includes("entidade")) return "estrutura.entidade";
  if (s.includes("posição")) return "dados.propriedade";
  if (s.includes("definir")) return "dados.propriedade";
  if (s.includes("quando")) return "comportamento.evento";
  if (s.includes("movimento") || s.includes("diminuir")) return "comportamento.acao";
  return undefined;
};

export function compileOldRewrite(source: string, options?: { intent_ref?: string; project_ref?: string }): CompilerResult {
  const diagnostics: CompilerDiagnostic[] = [];
  let ir: GoodleIRPrograma;
  try {
    ir = parseOldRewrite(source);
  } catch (error) {
    const line = typeof error === "object" && error && "linha" in error ? Number((error as { linha: unknown }).linha) : undefined;
    return { source: "oldrewrite", diagnostics: [{ severity: "error", code: "PARSE_ERROR", message: error instanceof Error ? error.message : "OldRewrite parse error", line }], executable: false };
  }

  let graph = createSemanticGraph(`graph-${crypto.randomUUID()}`);
  graph.intent_ref = options?.intent_ref;
  graph.project_ref = options?.project_ref;
  let sequence = 0;

  const lower = (node: GoodleIRNode, parentEvent?: string) => {
    sequence += 1;
    const id = `compiled-${sequence}`;
    const sid = semanticId(node);
    if (!sid) {
      diagnostics.push({ severity: "error", code: "UNRESOLVED_SEMANTICS", message: `Semântica sem lowering confirmado: ${node.semantica}`, line: Number(node.metadados?.linha) || undefined });
      return;
    }
    graph = addSemanticNode(graph, { id, semantic_id: sid, kind: semanticKind(node), authority: "VALIDATED", provenance_refs: options?.intent_ref ? [options.intent_ref] : [], attributes: { ...node.dados, source_semantics: node.semantica } });
    if (parentEvent) graph = addSemanticRelation(graph, { id: `relation-${parentEvent}-${id}`, source: parentEvent, target: id, relation: "triggers", authority: "VALIDATED", provenance_refs: options?.intent_ref ? [options.intent_ref] : [] });
    if (sid === "comportamento.evento") for (const child of node.filhos ?? []) lower(child, id);
  };

  for (const node of ir.nos) lower(node);
  const executable = diagnostics.every((diagnostic) => diagnostic.severity !== "error") && graph.nodes.length > 0;
  return { source: "oldrewrite", ir, semantic_graph: graph, diagnostics, executable };
}
