import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M84 — physics", () => {
  it("converge velocidade, aceleração, gravidade, massa, impulso e update", () => {
    const programa = parseOldRewrite(`velocidade heroi para 2 0
aceleracao heroi para 1 0
gravidade heroi para 0 0
massa heroi para 2
impulso heroi para 4
atualizar fisica 1`);
    expect(programa.nos.map((n) => n.semantica)).toEqual([
      "fisica.velocidade", "fisica.aceleracao", "fisica.gravidade",
      "fisica.massa", "fisica.impulso", "fisica.atualizar"
    ]);
  });
});
