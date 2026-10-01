import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M87 — solver validation", () => {
  it("aceita simulação e iterações válidas", () => {
    expect(validarGoodleIR(parseOldRewrite(`iterações 8
simular fisica 0.016`))).toEqual([]);
  });
});
