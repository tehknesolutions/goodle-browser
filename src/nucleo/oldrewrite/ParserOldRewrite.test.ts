import { describe, expect, it } from "vitest";
import { ErroParserOldRewrite, parseOldRewrite } from "./ParserOldRewrite";

describe("Parser OldRewrite V1", () => {
  it("transforma criar entidade heroi em entidade.criar", () => {
    const programa = parseOldRewrite("criar entidade heroi");
    expect(programa.versao).toBe("1");
    expect(programa.nos).toHaveLength(1);
    expect(programa.nos[0].semantica).toBe("entidade.criar");
    expect(programa.nos[0].familia).toBe("execucao");
    expect(programa.nos[0].parametros).toEqual({ tipo: "entidade", nome: "heroi" });
  });

  it("tolera espaços extras", () => {
    expect(parseOldRewrite("  criar   entidade   heroi  ").nos[0].parametros).toEqual({ tipo: "entidade", nome: "heroi" });
  });

  it("fonte vazia gera programa V1 vazio", () => {
    expect(parseOldRewrite("   \n\n ")).toEqual({ versao: "1", nos: [] });
  });

  it("comando desconhecido informa linha e texto original", () => {
    try {
      parseOldRewrite("voar para lua");
      throw new Error("esperava ErroParserOldRewrite");
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroParserOldRewrite);
      expect(erro).toMatchObject({ linha: 1, texto: "voar para lua" });
    }
  });

  it("aceita mistura PT-BR/EN sem interpretar o nome da entidade", () => {
    const no = parseOldRewrite("criar entity heroi").nos[0];
    expect(no.semantica).toBe("entidade.criar");
    expect(no.parametros).toEqual({ tipo: "entidade", nome: "heroi" });
  });

  it("aceita o slice personagem para o fluxo ponta a ponta planejado", () => {
    const no = parseOldRewrite("criar personagem heroi").nos[0];
    expect(no.semantica).toBe("entidade.criar");
    expect(no.parametros).toEqual({ tipo: "personagem", nome: "heroi" });
  });
});
