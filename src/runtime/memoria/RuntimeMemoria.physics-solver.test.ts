import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M87 — physics solver", () => {
  it("executa integração → regras → resolução → regras finais", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 0 0
massa heroi para 1
velocidade heroi para 2 0
aceleracao heroi para 1 0`), runtime);
    const resultado = runtime.executar(parseOldRewrite("simular fisica 2").nos[0]);
    expect(resultado.estado).toBe("executado");
    expect(resultado.valor.aplicado).toBe(true);
    expect(resultado.valor.dt).toBe(2);
    expect(runtime.entidades()[0].posicao).toEqual({ x: 8, y: 0 });
    expect(runtime.entidades()[0].fisica?.vx).toBe(4);
  });

  it("respeita limite determinístico de iterações", () => {
    const runtime = new RuntimeMemoria();
    runtime.executar(parseOldRewrite("iterações 8").nos[0]);
    const resultado = runtime.executar(parseOldRewrite("simular fisica 0").nos[0]);
    expect(resultado.valor.iteracoes).toBe(8);
  });

  it("rejeita número de iterações fora do limite", () => {
    const runtime = new RuntimeMemoria();
    const resultado = runtime.executar(parseOldRewrite("iterações 33").nos[0]);
    expect(resultado.estado).toBe("nao_suportado");
    expect(resultado.valor.motivo).toBe("iteracoes_invalidas");
  });

  it("resolve colisão durante a simulação", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 3 0
massa a para 1
massa b para 1
definir circulo de a raio 2
definir circulo de b raio 2`), runtime);
    const resultado = runtime.executar(parseOldRewrite("simular fisica 0").nos[0]);
    expect(resultado.valor.colisoes.length).toBeGreaterThan(0);
    expect(resultado.valor.colisoes[0]).toMatchObject({ colidiu: true });
  });
});
