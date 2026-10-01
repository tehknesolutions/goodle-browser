import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M75 — validação de condições", () => {
  it("aceita condição completa", () => {
    const programa = parseOldRewrite(`quando heroi tocar inimigo:
  se vida de heroi maior que 0:
    diminuir vida de heroi em 10`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });

  it("rejeita condição sem ação", () => {
    const programa = parseOldRewrite(`quando heroi tocar inimigo:
  se vida de heroi maior que 0:`);
    expect(validarGoodleIR(programa).some((d) => d.codigo === "COMPORTAMENTO_SEM_ACAO")).toBe(true);
  });
});
