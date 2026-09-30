import { describe, expect, it } from "vitest";
import { mapGoodleHnkIrToVerseCommands } from "./GoodleHnkIrMapper";

const context = {
  actorId: "agent:goodle",
  verseId: "VERSE-ZERO-001",
  worldId: "WORLD-ZERO-MALKUTH-001",
  sessionId: "session-1",
  issuedAt: "2026-09-30T15:00:00Z",
  correlationId: "exec-1",
};

describe("goodle-hnkir-to-hnk-verse/v0.1", () => {
  it("maps a Goodle ENTITY to the official CraftEntity command envelope", () => {
    const commands = mapGoodleHnkIrToVerseCommands({
      schema: "hnk-ir/goodle-v0.1",
      hom_ref: "hom-1",
      nodes: [{ id: "entity-1", kind: "ENTITY", semantic_id: "estrutura.entidade", authority: "VALIDATED", payload: { data: { nome: "Player" } }, provenance_refs: ["intent-1"] }],
      relations: [],
    }, context);
    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({ commandType: "CraftEntity", actorId: "agent:goodle", verseId: "VERSE-ZERO-001", worldId: "WORLD-ZERO-MALKUTH-001", targetId: "entity-1", correlationId: "exec-1" });
    expect(commands[0].payload).toMatchObject({ sourceKind: "ENTITY", semanticId: "estrutura.entidade", sourceRef: "entity-1" });
  });

  it("refuses kinds without a confirmed native command mapping", () => {
    expect(() => mapGoodleHnkIrToVerseCommands({
      schema: "hnk-ir/goodle-v0.1",
      hom_ref: "hom-1",
      nodes: [{ id: "event-1", kind: "EVENT", semantic_id: "comportamento.evento", authority: "VALIDATED", payload: {}, provenance_refs: [] }],
      relations: [],
    }, context)).toThrow("HNK_VERSE_MAPPING_UNRESOLVED");
  });
});
