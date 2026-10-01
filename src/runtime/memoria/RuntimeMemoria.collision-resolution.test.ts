import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M86 — collision resolution", () => {
  it("resolve círculo-círculo e corrige penetração", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 3 0
massa a para 1
massa b para 1
definir circulo de a raio 2
definir circulo de b raio 2`), runtime);
    const resultado = runtime.executar(parseOldRewrite("resolver colisões").nos[0]);
    expect(resultado.estado).toBe("executado");
    expect(resultado.valor.colisoes[0]).toMatchObject({ colidiu: true, normal: { x: 1, y: 0 }, penetracao: 1 });
    expect(runtime.entidades()[0].posicao?.x).toBe(-0.5);
    expect(runtime.entidades()[1].posicao?.x).toBe(3.5);
  });

  it("trata corpo bloqueado como massa infinita", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 3 0
massa a para 1
massa b para 1
bloqueio a
definir circulo de a raio 2
definir circulo de b raio 2`), runtime);
    runtime.executar(parseOldRewrite("resolver colisões").nos[0]);
    expect(runtime.entidades()[0].posicao?.x).toBe(0);
    expect(runtime.entidades()[1].posicao?.x).toBe(4);
  });

  it("não altera estado quando não há colisão", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 10 0
definir circulo de a raio 1
definir circulo de b raio 1`), runtime);
    const antes = JSON.stringify(runtime.entidades());
    runtime.executar(parseOldRewrite("resolver colisões").nos[0]);
    expect(JSON.stringify(runtime.entidades())).toBe(antes);
  });
});
