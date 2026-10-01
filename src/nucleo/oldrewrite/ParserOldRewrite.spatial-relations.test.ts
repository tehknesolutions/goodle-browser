import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M82 — spatial relations", () => {
  it("converge collision/near/inside/outside conditions", () => {
    const programa = parseOldRewrite(`se heroi colidir moeda:
  aumentar pontos de heroi em 1`);
    expect(programa.nos[0]).toMatchObject({
      semantica: "se",
      parametros: { relacao: "espaco.colisao", sujeito: "heroi", objeto: "moeda" },
    });
  });
});
