import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M80 — entity state validation", () => {
  it("aceita operações com alvo", () => {
    const programa = parseOldRewrite(`ativar heroi
desativar heroi
spawn inimigo
despawn inimigo`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });
});
