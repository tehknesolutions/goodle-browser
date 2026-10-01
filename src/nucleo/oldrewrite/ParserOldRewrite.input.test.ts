import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M77 — input events", () => {
  it("converge teclado PT-BR e inglês", () => {
    const pt = parseOldRewrite(`quando pressionar tecla espaco:
  aumentar vida de heroi em 10
quando soltar tecla espaco:
  diminuir vida de heroi em 5`);
    expect(pt.nos[0].parametros).toMatchObject({ evento: "evento.tecla.pressionar", codigo: "espaco" });
    expect(pt.nos[1].parametros).toMatchObject({ evento: "evento.tecla.soltar", codigo: "espaco" });

    const en = parseOldRewrite(`when press key space:
  increase life of hero by 10
when release key space:
  decrease life of hero by 5`);
    expect(en.nos[0].parametros).toMatchObject({ evento: "evento.tecla.pressionar", codigo: "space" });
    expect(en.nos[1].parametros).toMatchObject({ evento: "evento.tecla.soltar", codigo: "space" });
  });

  it("reconhece clique", () => {
    const programa = parseOldRewrite(`quando clicar botao:
  diminuir vida de heroi em 5`);
    expect(programa.nos[0].parametros).toMatchObject({ evento: "evento.clique", alvo: "botao" });
  });
});
