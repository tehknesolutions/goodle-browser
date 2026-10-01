import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M79 — scene validation", () => {
  it("aceita cena e transição completas", () => {
    const programa = parseOldRewrite(`criar cena menu
criar cena jogo
quando iniciar:
  transicionar para cena jogo`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });
});
