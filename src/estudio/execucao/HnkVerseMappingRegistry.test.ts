import { describe, expect, it } from "vitest";
import { resolveHnkVerseMapping, HNK_VERSE_MAPPING_REGISTRY } from "./HnkVerseMappingRegistry";

describe("HNK-VERSE mapping registry", () => {
  it("publishes the validated ENTITY mapping with payload requirements", () => {
    expect(resolveHnkVerseMapping("ENTITY", "estrutura.entidade")).toMatchObject({
      sourceKind: "ENTITY",
      nativeCommand: "CraftEntity",
      version: "goodle-hnkir-to-hnk-verse/v0.1",
      status: "VALIDATED",
    });
  });

  it("keeps unsupported semantic bindings unresolved", () => {
    expect(resolveHnkVerseMapping("EVENT", "comportamento.evento")).toMatchObject({ status: "UNRESOLVED" });
  });

  it("does not duplicate mapping identities", () => {
    const ids = HNK_VERSE_MAPPING_REGISTRY.map((entry) => `${entry.sourceKind}:${entry.semanticId}`);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
