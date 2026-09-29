import { describe, expect, it } from "vitest";
import { ErroParserOldRewrite, parseOldRewrite } from "./ParserOldRewrite";

describe("ParserOldRewrite — Behavior/Event V1", () => {
  it("parseia definição numérica de propriedade", () => {
    const programa = parseOldRewrite("definir vida de heroi como 100");
    expect(programa.nos[0]).toMatchObject({
      semantica: "dados.valor.definir",
      parametros: { entidade: "heroi", propriedade: "vida", valor: 100 },
    });
  });

  it("parseia bloco quando com ação filha", () => {
    const programa = parseOldRewrite("quando heroi tocar inimigo:\n  diminuir vida de heroi em 10");
    expect(programa.nos).toHaveLength(1);
    expect(programa.nos[0]).toMatchObject({
      semantica: "comportamento.reacao.quando",
      parametros: { evento: "evento.toque", fonte: "heroi", alvo: "inimigo" },
    });
    expect(programa.nos[0].filhos?.[0]).toMatchObject({
      semantica: "dados.valor.diminuir",
      parametros: { entidade: "heroi", propriedade: "vida", valor: 10 },
    });
  });

  it.each([
    ["when heroi touches inimigo:\n  decrease vida of heroi by 10"],
    ["quando heroi touches inimigo:\n  decrease vida de heroi em 10"],
  ])("converge inglês/mix para a mesma árvore semântica", (fonte) => {
    const no = parseOldRewrite(fonte).nos[0];
    expect(no.semantica).toBe("comportamento.reacao.quando");
    expect(no.parametros).toMatchObject({ evento: "evento.toque", fonte: "heroi", alvo: "inimigo" });
    expect(no.filhos?.[0]).toMatchObject({ semantica: "dados.valor.diminuir", parametros: { entidade: "heroi", propriedade: "vida", valor: 10 } });
  });

  it.each([
    "definir vida de heroi como muito",
    "diminuir vida de heroi em dez",
  ])("rejeita valor não numérico: %s", (fonte) => {
    expect(() => parseOldRewrite(fonte)).toThrow(ErroParserOldRewrite);
  });
});
