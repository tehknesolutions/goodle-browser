import { describe, expect, it } from "vitest";
import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import { RuntimeMemoria } from "./RuntimeMemoria";

const no = (semantica: string, parametros: Record<string, unknown> = {}, filhos?: GoodleIRNode[]): GoodleIRNode => ({ id: `test-${semantica}`, semantica, familia: "comportamento", parametros, ...(filhos ? { filhos } : {}) });

const preparar = () => {
  const runtime = new RuntimeMemoria();
  runtime.executar(no("entidade.criar", { nome: "heroi", tipo: "personagem" }));
  runtime.executar(no("entidade.criar", { nome: "inimigo", tipo: "personagem" }));
  return runtime;
};

describe("RuntimeMemoria — Behavior/Event V1", () => {
  it("define propriedade numérica", () => {
    const runtime = preparar();
    runtime.executar(no("dados.valor.definir", { entidade: "heroi", propriedade: "vida", valor: 100 }));
    expect(runtime.entidades().find((e) => e.nome === "heroi")?.propriedades?.vida).toBe(100);
  });

  it("registra toque e executa ação filha ao emitir evento", () => {
    const runtime = preparar();
    runtime.executar(no("dados.valor.definir", { entidade: "heroi", propriedade: "vida", valor: 100 }));
    runtime.registrar(no("comportamento.reacao.quando", { evento: "evento.toque", fonte: "heroi", alvo: "inimigo" }, [no("dados.valor.diminuir", { entidade: "heroi", propriedade: "vida", valor: 10 })]));
    expect(runtime.emitir({ semantica: "evento.toque", fonte: "heroi", alvo: "inimigo" }).estado).toBe("executado");
    expect(runtime.entidades().find((e) => e.nome === "heroi")?.propriedades?.vida).toBe(90);
  });

  it("diagnostica entidade inexistente na emissão", () => {
    const runtime = preparar();
    expect(runtime.emitir({ semantica: "evento.toque", fonte: "fantasma", alvo: "inimigo" }).estado).toBe("entidade_nao_encontrada");
  });

  it("não cria propriedade implicitamente ao diminuir", () => {
    const runtime = preparar();
    runtime.registrar(no("comportamento.reacao.quando", { evento: "evento.toque", fonte: "heroi", alvo: "inimigo" }, [no("dados.valor.diminuir", { entidade: "heroi", propriedade: "vida", valor: 10 })]));
    expect(runtime.emitir({ semantica: "evento.toque", fonte: "heroi", alvo: "inimigo" }).estado).toBe("propriedade_nao_encontrada");
    expect(runtime.entidades().find((e) => e.nome === "heroi")?.propriedades?.vida).toBeUndefined();
  });

  it("não executa evento desconhecido", () => {
    const runtime = preparar();
    expect(runtime.emitir({ semantica: "evento.teleporte", fonte: "heroi", alvo: "inimigo" }).estado).toBe("evento_desconhecido");
  });
});
