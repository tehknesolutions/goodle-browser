import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M84 — physics validation", () => {
  it("aceita parâmetros físicos completos", () => {
    const programa = parseOldRewrite(`massa heroi para 2
velocidade heroi para 1 0
aceleracao heroi para 0 2
gravidade heroi para 0 9.8
atualizar fisica 0.016`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });
});
