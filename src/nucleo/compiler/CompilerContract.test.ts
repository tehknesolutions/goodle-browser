import { describe, expect, it } from "vitest";
import { compileOldRewrite } from "./CompilerContract";

describe("Compiler Contract", () => {
  it("compiles confirmed OldRewrite commands into a Semantic Graph", () => {
    const result = compileOldRewrite("criar entidade Player\ndefinir vida de Player como 100\nquando Player tocar Portal:\n  diminuir vida de Player em 10", { intent_ref: "intent-1" });
    expect(result.executable).toBe(true);
    expect(result.semantic_graph?.nodes.map((node) => node.semantic_id)).toEqual(["estrutura.entidade", "dados.propriedade", "comportamento.evento", "comportamento.acao"]);
    expect(result.semantic_graph?.relations[0]).toMatchObject({ relation: "triggers" });
  });

  it("returns diagnostics instead of guessing unknown syntax", () => {
    const result = compileOldRewrite("teletransportar Player para Marte");
    expect(result.executable).toBe(false);
    expect(result.diagnostics[0].code).toBe("PARSE_ERROR");
  });
});
