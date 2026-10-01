import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M83 — geometry", () => {
  it("converge ponto, círculo e retângulo", () => {
    const programa = parseOldRewrite(`definir ponto de heroi
definir circulo de moeda raio 2
definir retangulo de parede 10 4`);
    expect(programa.nos.map((n) => n.semantica)).toEqual([
      "geometria.ponto", "geometria.circulo", "geometria.retangulo"
    ]);
    expect(programa.nos[1].parametros?.raio).toBe(2);
    expect(programa.nos[2].parametros).toMatchObject({ largura: 10, altura: 4 });
  });
});
