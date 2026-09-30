import { describe, expect, it } from "vitest";
import { createManifestationTarget } from "./ManifestationGraph";

describe("Manifestation Graph", () => {
  it("preserves source IR identity across supported targets", () => {
    const node = { id: "ir-1", semantica: "estrutura.entidade", familia: "estrutura" as const };
    const web = createManifestationTarget(node, "web", "react", "19");
    const game = createManifestationTarget(node, "game", "phaser", "3");

    expect(web.source_ir).toBe(node.id);
    expect(game.source_ir).toBe(node.id);
    expect(web.target_id).not.toBe(game.target_id);
    expect(web).toMatchObject({
      support_status: "SUPPORTED",
      capability_evidence: "RUNTIME",
    });
    expect(game).toMatchObject({
      support_status: "SUPPORTED",
      capability_evidence: "RUNTIME",
    });
  });

  it("keeps unsupported targets explicit instead of silently substituting an adapter", () => {
    const node = { id: "ir-2", semantica: "midia.video", familia: "execucao" as const };
    const target = createManifestationTarget(node, "video", "react", "19");

    expect(target).toMatchObject({
      source_ir: "ir-2",
      kind: "video",
      adapter: "react",
      support_status: "UNSUPPORTED",
      unsupported_reason: "UNSUPPORTED_KIND",
      capability_refs: [],
    });
  });
});
