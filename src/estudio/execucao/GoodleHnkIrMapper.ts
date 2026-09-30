import type { HnkIRProgram, HnkIRNode } from "../../nucleo/hnkir/HnkIR";

export type NativeHnkVerseCommand = {
  commandId: string;
  commandType: string;
  schemaVersion: number;
  actorId: string;
  verseId: string;
  worldId: string;
  sessionId: string;
  targetId?: string;
  issuedAtReal: string;
  issuedAtWorld: string;
  correlationId: string;
  causationId?: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
};

export type GoodleVerseMappingContext = {
  actorId: string;
  verseId: string;
  worldId: string;
  sessionId: string;
  issuedAt: string;
  correlationId: string;
};

function mapNode(node: HnkIRNode, context: GoodleVerseMappingContext, index: number): NativeHnkVerseCommand {
  // v0.1 maps only the native command whose semantics are already confirmed by HNK-VERSE.
  // Other kinds remain unresolved rather than being coerced into unrelated commands.
  if (node.kind !== "ENTITY") {
    throw new Error(`HNK_VERSE_MAPPING_UNRESOLVED: ${node.kind} (${node.semantic_id})`);
  }
  return {
    commandId: `${context.correlationId}-command-${index + 1}`,
    commandType: "CraftEntity",
    schemaVersion: 1,
    actorId: context.actorId,
    verseId: context.verseId,
    worldId: context.worldId,
    sessionId: context.sessionId,
    targetId: node.id,
    issuedAtReal: context.issuedAt,
    issuedAtWorld: context.issuedAt,
    correlationId: context.correlationId,
    idempotencyKey: `${context.correlationId}:${node.id}:CraftEntity`,
    payload: {
      sourceKind: node.kind,
      semanticId: node.semantic_id,
      sourceRef: node.id,
      sourceAuthority: node.authority,
      provenanceRefs: [...node.provenance_refs],
      data: node.payload,
    },
  };
}

export function mapGoodleHnkIrToVerseCommands(program: HnkIRProgram, context: GoodleVerseMappingContext): NativeHnkVerseCommand[] {
  return program.nodes.map((node, index) => mapNode(node, context, index));
}
