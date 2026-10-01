import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M84 — physics runtime", () => {
  it("integra velocidade e aceleração com dt explícito", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 0 0
velocidade heroi para 2 0
aceleracao heroi para 1 0
massa heroi para 1
atualizar fisica 2`), runtime);
    const heroi = runtime.entidades()[0];
    expect(heroi.posicao).toEqual({ x: 8, y: 0 });
    expect(heroi.fisica).toMatchObject({ vx: 4, vy: 0 });
  });

  it("aplica gravidade determinística", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 0 0
massa heroi para 1
gravidade heroi para 0 10
atualizar fisica 1`), runtime);
    expect(runtime.entidades()[0].posicao).toEqual({ x: 0, y: 10 });
    expect(runtime.entidades()[0].fisica?.vy).toBe(10);
  });

  it("aplica impulso como dv = impulso / massa", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 0 0
massa heroi para 2
impulso heroi para 6
atualizar fisica 1`), runtime);
    expect(runtime.entidades()[0].fisica?.vx).toBe(3);
    expect(runtime.entidades()[0].posicao?.x).toBe(3);
  });
});
