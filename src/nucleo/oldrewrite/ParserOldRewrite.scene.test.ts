import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M79 — cenas", () => {
  it("converge criação e transição", () => {
    const programa = parseOldRewrite(`criar cena menu
criar cena jogo
quando iniciar:
  transicionar para cena jogo`);
    expect(programa.nos[0]).toMatchObject({ semantica: "estrutura.cena", parametros: { nome: "menu" } });
    expect(programa.nos[1]).toMatchObject({ semantica: "estrutura.cena", parametros: { nome: "jogo" } });
    expect(programa.nos[2].filhos?.[0]).toMatchObject({ semantica: "cena.transicao", parametros: { destino: "jogo" } });
  });
});
