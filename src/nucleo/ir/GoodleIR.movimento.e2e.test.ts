import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
import { HyperKernel } from "../../runtime/HyperKernel";
import { RuntimeMemoria } from "../../runtime/memoria/RuntimeMemoria";

describe("Goodle IR — slice posição + movimento", () => {
  it("cria personagem, posiciona e move sem conhecer engine concreta", () => {
    const programa = parseOldRewrite(`
      criar personagem heroi
      posicionar heroi em 10 20
      mover heroi por 5 -2
    `);

    expect(programa.nos.map((no) => no.semantica)).toEqual([
      "entidade.criar",
      "espaco.posicao",
      "espaco.movimento",
    ]);
    expect(validarGoodleIR(programa)).toEqual([]);

    const runtime = new RuntimeMemoria();
    const resultado = new HyperKernel().executar(programa, runtime);

    expect(resultado.estado).toBe("concluido");
    expect(runtime.entidades()).toEqual([
      { nome: "heroi", tipo: "personagem", posicao: { x: 15, y: 18 } },
    ]);
  });

  it("aceita comandos equivalentes em inglês", () => {
    const programa = parseOldRewrite(`
      criar personagem heroi
      position heroi at 10 20
      move heroi by 5 -2
    `);
    expect(programa.nos.map((no) => no.semantica)).toEqual([
      "entidade.criar",
      "espaco.posicao",
      "espaco.movimento",
    ]);
  });
});
