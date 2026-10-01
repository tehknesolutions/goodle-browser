import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M83 — geometry validation", () => {
  it("aceita formas com parâmetros válidos", () => {
    const programa = parseOldRewrite(`definir ponto de heroi
definir circulo de moeda raio 2
definir retangulo de parede 10 4`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });
});
