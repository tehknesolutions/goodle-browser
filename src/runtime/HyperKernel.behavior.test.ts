import { describe, expect, it, vi } from "vitest";
import type { GoodleIRNode, GoodleIRPrograma } from "../nucleo/ir/GoodleIR";
import type { RuntimeGoodle } from "./ContratoRuntimeGoodle";
import { HyperKernel } from "./HyperKernel";

const comportamento = (): GoodleIRNode => ({
  id: "quando-1", semantica: "comportamento.reacao.quando", familia: "comportamento",
  parametros: { evento: "evento.toque", fonte: "heroi", alvo: "inimigo" },
  filhos: [{ id: "acao-1", semantica: "dados.valor.diminuir", familia: "comportamento", parametros: { entidade: "heroi", propriedade: "vida", valor: 10 } }],
});
const programa = (no: GoodleIRNode): GoodleIRPrograma => ({ versao: "1", nos: [no] });

describe("HyperKernel — Behavior/Event V1", () => {
  it("registra comportamento válido quando runtime oferece capacidade", () => {
    const registrar = vi.fn(() => ({ estado: "executado" as const, idNo: "quando-1", semantica: "comportamento.reacao.quando" }));
    const runtime: RuntimeGoodle = { suporta: () => true, executar: vi.fn(), registrar };
    const resultado = new HyperKernel().executar(programa(comportamento()), runtime);
    expect(resultado.estado).toBe("concluido");
    expect(registrar).toHaveBeenCalledOnce();
  });

  it("não registra IR inválido", () => {
    const registrar = vi.fn();
    const runtime: RuntimeGoodle = { suporta: () => true, executar: vi.fn(), registrar };
    const invalido = { ...comportamento(), filhos: [] };
    expect(new HyperKernel().executar(programa(invalido), runtime).estado).toBe("ir_invalido");
    expect(registrar).not.toHaveBeenCalled();
  });

  it("não faz fallback quando runtime não oferece registro", () => {
    const executar = vi.fn();
    const runtime: RuntimeGoodle = { suporta: () => true, executar };
    const resultado = new HyperKernel().executar(programa(comportamento()), runtime);
    expect(resultado.estado).toBe("concluido");
    expect(resultado.resultados[0]).toMatchObject({ estado: "nao_suportado", semantica: "comportamento.reacao.quando" });
    expect(executar).not.toHaveBeenCalled();
  });
});
