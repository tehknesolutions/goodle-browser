import { describe, expect, it } from "vitest";
import type { GoodleIRNode, GoodleIRPrograma } from "./GoodleIR";

describe("Goodle IR V1", () => {
  it("preserva o contrato completo de um nó IR", () => {
    const filho: GoodleIRNode = {
      id: "no-2",
      semantica: "dados.propriedade",
      familia: "dados",
      parametros: { nome: "vida", valor: 100 },
    };
    const no: GoodleIRNode = {
      id: "no-1",
      semantica: "entidade.criar",
      familia: "execucao",
      parametros: { tipo: "personagem", nome: "heroi" },
      filhos: [filho],
      origem: { familia: "godot", termo: "instantiate", equivalencia: "contextual" },
      metadados: { linha: 1 },
    };
    const programa: GoodleIRPrograma = { versao: "1", nos: [no] };

    expect(programa.versao).toBe("1");
    expect(programa.nos[0]).toEqual(no);
    expect(programa.nos[0].filhos?.[0]).toEqual(filho);
    expect(programa.nos[0].origem).toEqual({ familia: "godot", termo: "instantiate", equivalencia: "contextual" });
  });
});
