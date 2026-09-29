import { describe, expect, it } from "vitest";
import { criarNoSemantico, ErroSemanticoIR } from "./criarNoSemantico";

describe("Semantic Bridge -> Goodle IR", () => {
  it("converge função PT-BR e function TypeScript para a mesma semântica", () => {
    expect(criarNoSemantico("função", "comportamento").semantica).toBe("comportamento.funcao");
    expect(criarNoSemantico("function", "comportamento", {}, "typescript").semantica).toBe("comportamento.funcao");
  });

  it("rejeita alias contextual sem origem suficiente", () => {
    expect(() => criarNoSemantico("signal", "comportamento")).toThrow(ErroSemanticoIR);
  });

  it("preserva origem e equivalência contextual de signal/godot", () => {
    const no = criarNoSemantico("signal", "comportamento", { nome: "atingido" }, "godot");
    expect(no.semantica).toBe("comportamento.emissao");
    expect(no.origem).toEqual({ familia: "godot", termo: "signal", equivalencia: "contextual" });
    expect(no.parametros).toEqual({ nome: "atingido" });
  });
});
