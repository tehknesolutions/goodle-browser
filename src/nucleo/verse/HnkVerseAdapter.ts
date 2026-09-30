import type { HnkIRNode, HnkIRProgram } from "../hnkir/HnkIR";

export type VerseOperation = {
  operation_id: string;
  operation: "world" | "entity" | "property" | "event" | "action";
  source_ir: string;
  payload: Record<string, unknown>;
  provenance_refs: string[];
};

export type HnkVersePlan = {
  schema: "goodle-hnk-verse-plan/v0.1";
  source_hnkir: string;
  operations: VerseOperation[];
  unresolved: string[];
};

function lowerNode(node: HnkIRNode): VerseOperation | undefined {
  if (node.kind === "UNRESOLVED") return undefined;
  return {
    operation_id: `verse-${node.id}`,
    operation: node.kind.toLowerCase() as VerseOperation["operation"],
    source_ir: node.id,
    payload: { semantic_id: node.semantic_id, ...node.payload },
    provenance_refs: [...node.provenance_refs, node.id],
  };
}

export function hnkIRToVersePlan(program: HnkIRProgram): HnkVersePlan {
  const operations = program.nodes.map(lowerNode).filter((item): item is VerseOperation => Boolean(item));
  return {
    schema: "goodle-hnk-verse-plan/v0.1",
    source_hnkir: program.hom_ref,
    operations,
    unresolved: program.nodes.filter((node) => node.kind === "UNRESOLVED").map((node) => node.id),
  };
}
