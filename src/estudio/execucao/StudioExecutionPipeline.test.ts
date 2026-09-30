import { describe, expect, it } from "vitest";
import { prepareStudioExecution } from "./StudioExecutionPipeline";

describe("StudioExecutionPipeline compiler gate", () => {
  it("uses compiled OldRewrite semantics instead of a synthetic intent.user node", () => {
    const prepared = prepareStudioExecution({
      intent: "criar entidade Player\ndefinir vida de Player como 100\nquando Player tocar Portal:\n  diminuir vida de Player em 10",
      now: "2026-09-30T13:00:00Z",
      intentId: "intent-1",
    });

    expect(prepared.compiler.executable).toBe(true);
    expect(prepared.semanticGraph.nodes.map((node) => node.semantic_id)).toEqual([
      "estrutura.entidade",
      "dados.propriedade",
      "comportamento.evento",
      "comportamento.acao",
    ]);
    expect(prepared.semanticGraph.nodes.some((node) => node.semantic_id === "intent.user")).toBe(false);
    expect(prepared.versePlan.unresolved).toEqual([]);
  });

  it("stops before execution when compilation is unresolved", () => {
    expect(() => prepareStudioExecution({
      intent: "teletransportar Player para Marte",
      now: "2026-09-30T13:00:00Z",
      intentId: "intent-bad",
    })).toThrow("COMPILATION_REJECTED");
  });
});
