import { describe, expect, it } from "vitest";
import type { GoodleIRNode, GoodleIRPrograma } from "./GoodleIR";
import { validarGoodleIR } from "./validarGoodleIR";

const programa = (...nos: GoodleIRNode[]): GoodleIRPrograma => ({ versao: "1", nos });
const no = (semantica: string, parametros: Record<string, unknown> = {}, filhos?: GoodleIRNode[]): GoodleIRNode => ({
  id: `test-${semantica}`,
  semantica,
  familia: "comportamento",
  parametros,
  ...(filhos ? { filhos } : {}),
});

describe("validarGoodleIR — Behavior/Event V1", () => {
  it("diagnostica comportamento quando sem ação filha", () => {
    const diagnosticos = validarGoodleIR(programa(no("comportamento.reacao.quando", { evento: "evento.toque", fonte: "heroi", alvo: "inimigo" }, [])));
    expect(diagnosticos).toContainEqual(expect.objectContaining({ caminho: "nos[0].filhos", codigo: "COMPORTAMENTO_SEM_ACAO" }));
  });

  it.each(["evento", "fonte", "alvo"])("diagnostica parâmetro obrigatório ausente no toque: %s", (parametro) => {
    const parametros: Record<string, unknown> = { evento: "evento.toque", fonte: "heroi", alvo: "inimigo" };
    delete parametros[parametro];
    const diagnosticos = validarGoodleIR(programa(no("comportamento.reacao.quando", parametros, [no("dados.valor.diminuir", { entidade: "heroi", propriedade: "vida", valor: 10 })])));
    expect(diagnosticos).toContainEqual(expect.objectContaining({ caminho: `nos[0].parametros.${parametro}`, codigo: "PARAMETRO_OBRIGATORIO_AUSENTE" }));
  });

  it.each(["entidade", "propriedade", "valor"])("diagnostica parâmetro obrigatório ausente em diminuir: %s", (parametro) => {
    const parametros: Record<string, unknown> = { entidade: "heroi", propriedade: "vida", valor: 10 };
    delete parametros[parametro];
    const diagnosticos = validarGoodleIR(programa(no("dados.valor.diminuir", parametros)));
    expect(diagnosticos).toContainEqual(expect.objectContaining({ caminho: `nos[0].parametros.${parametro}`, codigo: "PARAMETRO_OBRIGATORIO_AUSENTE" }));
  });
});
