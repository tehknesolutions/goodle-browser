import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M77 — input runtime", () => {
  it("dispara ação ao pressionar tecla", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
definir vida de heroi como 100
quando pressionar tecla espaco:
  aumentar vida de heroi em 10`);
    new HyperKernel().executar(programa, runtime);
    const resultado = runtime.emitir({ semantica: "evento.tecla.pressionar", codigo: "espaco" });
    expect(resultado.estado).toBe("executado");
    expect(resultado.acoesExecutadas).toBe(1);
    expect(runtime.entidades()[0].propriedades?.vida).toBe(110);
  });

  it("dispara ação ao clicar alvo abstrato", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
definir vida de heroi como 100
quando clicar botao:
  diminuir vida de heroi em 5`);
    new HyperKernel().executar(programa, runtime);
    expect(runtime.emitir({ semantica: "evento.clique", alvo: "botao" }).estado).toBe("executado");
    expect(runtime.entidades()[0].propriedades?.vida).toBe(95);
  });

  it("mantém evento desconhecido explícito", () => {
    const runtime = new RuntimeMemoria();
    expect(runtime.emitir({ semantica: "evento.hardware.inexistente" }).estado).toBe("evento_desconhecido");
  });
});
