import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M83 — geometry runtime", () => {
  it("calcula colisão círculo-círculo por raio", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
criar objeto moeda
posicionar heroi em 0 0
posicionar moeda em 3 0
definir circulo de heroi raio 2
definir circulo de moeda raio 2`), runtime);
    const cond = parseOldRewrite(`se heroi colidir moeda:
  aumentar pontos de heroi em 1`).nos[0];
    runtime.executar(cond);
    expect(runtime.entidades()[0].propriedades?.pontos).toBe(1);
  });

  it("calcula colisão retângulo-retângulo", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 4 0
definir retangulo de a 4 4
definir retangulo de b 4 4`), runtime);
    const cond = parseOldRewrite(`se a colidir b:
  aumentar pontos de a em 1`).nos[0];
    runtime.executar(cond);
    expect(runtime.entidades()[0].propriedades?.pontos).toBe(1);
  });

  it("consulta ponto dentro de círculo", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem ponto
criar objeto area
posicionar ponto em 1 0
posicionar area em 0 0
definir ponto de ponto
definir circulo de area raio 2`), runtime);
    const cond = parseOldRewrite(`se ponto dentro area:
  aumentar pontos de ponto em 1`).nos[0];
    runtime.executar(cond);
    expect(runtime.entidades()[0].propriedades?.pontos).toBe(1);
  });

  it("mantém compatibilidade M82 sem geometria explícita", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0`), runtime);
    const cond = parseOldRewrite(`se a colidir b:
  aumentar pontos de a em 1`).nos[0];
    runtime.executar(cond);
    expect(runtime.entidades()[0].propriedades?.pontos).toBe(1);
  });
});
