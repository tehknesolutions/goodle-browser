import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M81 — spatial state", () => {
  it("converge posição, movimento, rotação e escala", () => {
    const programa = parseOldRewrite(`posicionar heroi em 10 20
mover heroi por 5 3
rotacionar heroi para 90
escalar heroi para 2 2`);
    expect(programa.nos.map((n) => n.semantica)).toEqual([
      "espaco.posicao", "espaco.movimento", "espaco.rotacao", "espaco.escala"
    ]);
  });
});
