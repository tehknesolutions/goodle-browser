import { describe, expect, it } from "vitest";
import { lerFluxoGoodle } from "./parserGoodle";

describe("lerFluxoGoodle", () => {
  it("converte se/senão em uma condição estrutural", () => {
    const resultado = lerFluxoGoodle(`
quando jogador entrar na cidade:
  se jogador tem chave:
    abrir portal
  senão:
    mostrar Você precisa da chave.
`);

    expect(resultado.sucesso).toBe(true);
    expect(resultado.fluxo?.executar).toEqual([
      {
        tipo: "condicao",
        nome: "jogador tem chave",
        filhos: [{ tipo: "acao", nome: "abrir portal" }],
        senao: [
          { tipo: "acao", nome: "mostrar Você precisa da chave." },
        ],
      },
    ]);
  });
});
