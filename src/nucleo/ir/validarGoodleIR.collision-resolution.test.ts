import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M86 — collision validation", () => {
  it("aceita resolver colisões", () => {
    expect(validarGoodleIR(parseOldRewrite("resolver colisões"))).toEqual([]);
  });
});
