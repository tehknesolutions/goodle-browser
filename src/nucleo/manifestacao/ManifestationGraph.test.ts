import { describe, expect, it } from "vitest";
import { createManifestationTarget } from "./ManifestationGraph";

describe("Manifestation Graph", () => {
  it("preserves source IR identity across targets", () => {
    const node = { id: "ir-1", semantica: "estrutura.entidade", familia: "estrutura" as const };
    const web = createManifestationTarget(node, "web", "react", "1");
    const game = createManifestationTarget(node, "game", "phaser", "3");
    expect(web.source_ir).toBe(node.id);
    expect(game.source_ir).toBe(node.id);
    expect(web.target_id).not.toBe(game.target_id);
  });
});
