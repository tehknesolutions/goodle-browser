import { describe, expect, it } from "vitest";
import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import { RuntimeMemoria } from "./RuntimeMemoria";

describe("RuntimeMemoria", () => {
  it("materializa entidade.criar em estado observável", () => {
    const runtime = new RuntimeMemoria();
    const no: GoodleIRNode = {
      id: "ir-1",
      semantica: "entidade.criar",
      familia: "execucao",
      parametros: { nome: "heroi", tipo: "personagem" },
    };

    expect(runtime.suporta(no.semantica)).toBe(true);
    expect(runtime.executar(no)).toMatchObject({ estado: "executado", idNo: "ir-1", semantica: "entidade.criar" });
    expect(runtime.entidades()).toEqual([{ nome: "heroi", tipo: "personagem" }]);
  });

  it("retorna nao_suportado para semântica não implementada", () => {
    const runtime = new RuntimeMemoria();
    const no: GoodleIRNode = { id: "ir-2", semantica: "comportamento.funcao", familia: "comportamento" };
    expect(runtime.suporta(no.semantica)).toBe(false);
    expect(runtime.executar(no)).toEqual({ estado: "nao_suportado", idNo: "ir-2", semantica: "comportamento.funcao" });
    expect(runtime.entidades()).toEqual([]);
  });
});
