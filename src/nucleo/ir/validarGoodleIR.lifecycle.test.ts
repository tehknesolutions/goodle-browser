import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";

describe("M76 — validação lifecycle", () => {
  it("aceita iniciar e atualizar sem fonte/alvo", () => {
    const programa = parseOldRewrite(`quando iniciar:
  aumentar vida de heroi em 10
quando atualizar:
  se vida de heroi maior que 100:
    definir vida de heroi como 100`);
    expect(validarGoodleIR(programa)).toEqual([]);
  });

  it("exige fonte e alvo apenas para toque", () => {
    const programa = parseOldRewrite(`quando iniciar:
  aumentar vida de heroi em 10`);
    programa.nos.push({
      ...parseOldRewrite(`quando heroi tocar inimigo:
  aumentar vida de heroi em 10`).nos[0],
      parametros: { evento: "evento.toque" }
    });
    const diagnosticos = validarGoodleIR(programa);
    expect(diagnosticos.filter((d) => d.codigo === "PARAMETRO_OBRIGATORIO_AUSENTE").length).toBe(2);
  });
});
