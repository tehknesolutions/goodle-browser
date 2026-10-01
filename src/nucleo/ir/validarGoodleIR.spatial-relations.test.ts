import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M82 — spatial relation validation", () => {
  it("aceita condição espacial", () => {
    const programa = parseOldRewrite(`se heroi colidir moeda:
  aumentar pontos de heroi em 1`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });
});
