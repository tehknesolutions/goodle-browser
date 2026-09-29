import { describe, expect, it } from "vitest";
import type { GoodleIRNode, GoodleIRPrograma } from "../nucleo/ir/GoodleIR";
import { HyperKernel } from "./HyperKernel";
import type { ResultadoExecucao, RuntimeGoodle } from "./ContratoRuntimeGoodle";

class RuntimeEspiao implements RuntimeGoodle {
  executados: string[] = [];
  constructor(private readonly suportadas: string[]) {}
  suporta(semantica: string): boolean { return this.suportadas.includes(semantica); }
  executar(no: GoodleIRNode): ResultadoExecucao {
    this.executados.push(no.id);
    return { estado: "executado", idNo: no.id, semantica: no.semantica };
  }
}

const programa = (...nos: GoodleIRNode[]): GoodleIRPrograma => ({ versao: "1", nos });
const no = (id: string, semantica = "entidade.criar"): GoodleIRNode => ({ id, semantica, familia: "execucao" });

describe("HyperKernel", () => {
  it("não envia IR inválido ao runtime", () => {
    const runtime = new RuntimeEspiao(["entidade.criar"]);
    const resultado = new HyperKernel().executar(programa(no("x", "nao.existe")), runtime);
    expect(runtime.executados).toEqual([]);
    expect(resultado.estado).toBe("ir_invalido");
  });

  it("despacha semântica suportada", () => {
    const runtime = new RuntimeEspiao(["entidade.criar"]);
    const resultado = new HyperKernel().executar(programa(no("a")), runtime);
    expect(runtime.executados).toEqual(["a"]);
    expect(resultado.resultados[0]).toMatchObject({ estado: "executado", idNo: "a" });
  });

  it("retorna nao_suportado sem fallback silencioso", () => {
    const runtime = new RuntimeEspiao([]);
    const resultado = new HyperKernel().executar(programa(no("a")), runtime);
    expect(runtime.executados).toEqual([]);
    expect(resultado.resultados[0]).toEqual({ estado: "nao_suportado", idNo: "a", semantica: "entidade.criar" });
  });

  it("preserva a ordem dos nós raiz", () => {
    const runtime = new RuntimeEspiao(["entidade.criar"]);
    new HyperKernel().executar(programa(no("a"), no("b"), no("c")), runtime);
    expect(runtime.executados).toEqual(["a", "b", "c"]);
  });
});
