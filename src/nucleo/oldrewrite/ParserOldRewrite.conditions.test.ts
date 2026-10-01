import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M75 — condições", () => {
  it("converge PT-BR para condição explícita", () => {
    const programa = parseOldRewrite(`criar personagem heroi
criar personagem inimigo
definir vida de heroi como 100
quando heroi tocar inimigo:
  se vida de heroi maior que 0:
    diminuir vida de heroi em 10`);
    const quando = programa.nos[3];
    const condicao = quando.filhos?.[0];
    expect(condicao).toMatchObject({
      semantica: "logica.condicao.se",
      parametros: { entidade: "heroi", propriedade: "vida", operador: "maior_que", valor: 0 },
    });
    expect(condicao?.filhos?.[0]?.semantica).toBe("dados.valor.diminuir");
  });

  it("converge inglês para a mesma condição", () => {
    const programa = parseOldRewrite(`when heroi touches inimigo:
  if vida of heroi greater than 0:
    decrease vida of heroi by 10`);
    expect(programa.nos[0].filhos?.[0]).toMatchObject({
      semantica: "logica.condicao.se",
      parametros: { entidade: "heroi", propriedade: "vida", operador: "maior_que", valor: 0 },
    });
  });
});
