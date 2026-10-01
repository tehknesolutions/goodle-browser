import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M78 — temporal validation", () => {
  it("aceita evento temporal com duração", () => {
    const programa = parseOldRewrite(`quando temporizador 1000:
  aumentar vida de heroi em 10`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });
});
