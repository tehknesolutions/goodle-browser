import { describe, expect, it } from "vitest";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { HyperKernel } from "../HyperKernel";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M76 — lifecycle runtime", () => {
  it("executa iniciar e aumentar", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
definir vida de heroi como 100
quando iniciar:
  aumentar vida de heroi em 10`);
    new HyperKernel().executar(programa, runtime);
    const resultado = runtime.emitir({ semantica: "evento.iniciar", fonte: "" });
    expect(resultado.estado).toBe("executado");
    expect(resultado.acoesExecutadas).toBe(1);
    expect(runtime.entidades()[0].propriedades?.vida).toBe(110);
  });

  it("executa atualizar com condição e corrige estado", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
definir vida de heroi como 110
quando atualizar:
  se vida de heroi maior que 100:
    definir vida de heroi como 100`);
    new HyperKernel().executar(programa, runtime);
    expect(runtime.emitir({ semantica: "evento.atualizar", fonte: "" }).estado).toBe("executado");
    expect(runtime.entidades()[0].propriedades?.vida).toBe(100);
  });

  it("mantém evento desconhecido diagnosticável", () => {
    const runtime = new RuntimeMemoria();
    expect(runtime.emitir({ semantica: "evento.inexistente", fonte: "" }).estado).toBe("evento_desconhecido");
  });
});
