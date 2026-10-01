import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M85 — physics rules validation", () => {
  it("aceita regras físicas válidas", () => {
    const p = parseOldRewrite(`limite -10 10 -5 5
superficie 0
atrito heroi para 0.2
restituicao heroi para 0.8
bloqueio heroi
aplicar regras 0.016`);
    expect(validarGoodleIR(p)).toEqual([]);
  });
});
