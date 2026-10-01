import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M81 — spatial validation", () => {
  it("aceita transformação espacial completa", () => {
    const programa = parseOldRewrite(`posicionar heroi em 10 20
mover heroi por 5 3
rotacionar heroi para 90
escalar heroi para 2 2`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });
});
