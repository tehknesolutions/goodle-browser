import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M82 — spatial relations", () => {
  it("calcula distância e colisão deterministicamente", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
criar objeto moeda
posicionar heroi em 0 0
posicionar moeda em 1 0`);
    new HyperKernel().executar(programa, runtime);
    expect(runtime.distanciaEntre("heroi", "moeda")).toBe(1);
    const cond = parseOldRewrite(`se heroi colidir moeda:
  aumentar pontos de heroi em 1`).nos[0];
    const resultado = runtime.executar(cond);
    expect(resultado.estado).toBe("executado");
    expect(runtime.entidades()[0].propriedades?.pontos).toBe(1);
  });

  it("rejeita colisão quando distância é maior que 1", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
criar objeto moeda
posicionar heroi em 0 0
posicionar moeda em 3 4`);
    new HyperKernel().executar(programa, runtime);
    const cond = parseOldRewrite(`se heroi colidir moeda:
  aumentar pontos de heroi em 1`).nos[0];
    runtime.executar(cond);
    expect(runtime.entidades()[0].propriedades?.pontos).toBeUndefined();
  });

  it("consulta dentro/fora e perto sem mutar estado", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
criar objeto moeda
posicionar heroi em 0 0
posicionar moeda em 2 0`);
    new HyperKernel().executar(programa, runtime);
    const antes = JSON.stringify(runtime.entidades());
    expect(runtime.distanciaEntre("heroi", "moeda")).toBe(2);
    const depois = JSON.stringify(runtime.entidades());
    expect(depois).toBe(antes);
  });

  it("mantém evento desconhecido explícito", () => {
    expect(new RuntimeMemoria().emitir({ semantica: "espaco.inexistente" }).estado).toBe("evento_desconhecido");
  });
});
