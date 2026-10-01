import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M78 — temporal events", () => {
  it("converge timeout/interval/wait", () => {
    const programa = parseOldRewrite(`quando temporizador 1000:
  aumentar vida de heroi em 10
quando intervalo 5000:
  aumentar pontos de heroi em 1
quando esperar 250:
  aumentar mana de heroi em 5`);
    expect(programa.nos.map((n) => n.parametros?.evento)).toEqual([
      "evento.temporizador.disparar",
      "evento.tempo.intervalo",
      "evento.tempo.esperar",
    ]);
    expect(programa.nos[0].parametros?.duracaoMs).toBe(1000);
    expect(programa.nos[1].parametros?.duracaoMs).toBe(5000);
  });
});
