import type { HnkIRProgram, HnkIRNode } from "../../nucleo/hnkir/HnkIR";
import { resolveHnkVerseMapping } from "./HnkVerseMappingRegistry";

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
  const mapping = resolveHnkVerseMapping(node.kind, node.semantic_id);
  if (mapping.status !== "VALIDATED" || !mapping.nativeCommand) {
    throw new Error(`HNK_VERSE_MAPPING_UNRESOLVED: ${node.kind} (${node.semantic_id})`);
  }

  const payload: Record<string, unknown> = {
    sourceKind: node.kind,
    semanticId: node.semantic_id,
    sourceRef: node.id,
    sourceAuthority: node.authority,
    provenanceRefs: [...node.provenance_refs],
    data: node.payload,
    mappingVersion: mapping.version,
  };
  const missingPayload = mapping.requiredPayload.filter((field) => !(field in payload));
  if (missingPayload.length > 0) {
    throw new Error(`HNK_VERSE_MAPPING_INVALID_PAYLOAD: ${missingPayload.join(",")}`);
  }

  return {
    commandId: `${context.correlationId}-command-${index + 1}`,
    commandType: mapping.nativeCommand,
    schemaVersion: 1,
    actorId: context.actorId,
    verseId: context.verseId,
    worldId: context.worldId,
    sessionId: context.sessionId,
    targetId: node.id,
    issuedAtReal: context.issuedAt,
    issuedAtWorld: context.issuedAt,
    correlationId: context.correlationId,
    idempotencyKey: `${context.correlationId}:${node.id}:${mapping.nativeCommand}`,
    payload,
  };
}

export function mapGoodleHnkIrToVerseCommands(program: HnkIRProgram, context: GoodleVerseMappingContext): NativeHnkVerseCommand[] {
  return program.nodes.map((node, index) => mapNode(node, context, index));
}
