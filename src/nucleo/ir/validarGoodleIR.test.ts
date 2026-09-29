import { describe, expect, it } from "vitest";
import type { GoodleIRPrograma } from "./GoodleIR";
import { validarGoodleIR } from "./validarGoodleIR";

const programaValido = (): GoodleIRPrograma => ({
  versao: "1",
  nos: [{ id: "ir-1", semantica: "entidade.criar", familia: "execucao", parametros: { nome: "heroi" } }],
});

describe("validarGoodleIR", () => {
  it("aceita programa estrutural e semanticamente válido", () => {
    expect(validarGoodleIR(programaValido())).toEqual([]);
  });

  it("rejeita semântica inexistente", () => {
    const programa = programaValido();
    programa.nos[0].semantica = "goodle.nao.existe";
    expect(validarGoodleIR(programa)).toContainEqual(expect.objectContaining({ caminho: "nos[0].semantica", codigo: "SEMANTICA_DESCONHECIDA" }));
  });

  it("rejeita família inválida ou ausente", () => {
    const programa = programaValido();
    (programa.nos[0] as unknown as { familia?: string }).familia = "universo7d";
    expect(validarGoodleIR(programa)).toContainEqual(expect.objectContaining({ caminho: "nos[0].familia", codigo: "FAMILIA_INVALIDA" }));
  });

  it("reporta caminho completo de filho inválido", () => {
    const programa = programaValido();
    programa.nos[0].filhos = [{ id: "ir-2", semantica: "nao.existe", familia: "dados" }];
    expect(validarGoodleIR(programa)).toContainEqual(expect.objectContaining({ caminho: "nos[0].filhos[0].semantica", codigo: "SEMANTICA_DESCONHECIDA" }));
  });

  it("acumula múltiplos diagnósticos", () => {
    const programa = programaValido();
    programa.nos[0].semantica = "nao.existe";
    (programa.nos[0] as unknown as { familia?: string }).familia = undefined;
    const diagnosticos = validarGoodleIR(programa);
    expect(diagnosticos.map((item) => item.codigo)).toEqual(expect.arrayContaining(["SEMANTICA_DESCONHECIDA", "FAMILIA_INVALIDA"]));
  });
});
