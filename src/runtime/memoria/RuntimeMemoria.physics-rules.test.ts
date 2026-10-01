import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M85 — physics rules runtime", () => {
  it("corrige superfície e aplica restituição", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 0 -1
massa heroi para 1
velocidade heroi para 0 -2
restituicao heroi para 0.5
superficie 0
aplicar regras 1`), runtime);
    const h = runtime.entidades()[0];
    expect(h.posicao?.y).toBe(0);
    expect(h.fisica?.vy).toBe(1);
  });

  it("aplica limite horizontal com restituição", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 12 0
massa heroi para 1
velocidade heroi para 3 0
restituicao heroi para 0.5
limite -10 10 -10 10
aplicar regras 1`), runtime);
    const h = runtime.entidades()[0];
    expect(h.posicao?.x).toBe(10);
    expect(h.fisica?.vx).toBe(-1.5);
  });

  it("aplica atrito sem engine", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 0 0
massa heroi para 1
velocidade heroi para 10 0
atrito heroi para 0.2
aplicar regras 1`), runtime);
    expect(runtime.entidades()[0].fisica?.vx).toBe(8);
  });

  it("bloqueia movimento", () => {
    const runtime = new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem heroi
posicionar heroi em 5 5
massa heroi para 1
velocidade heroi para 10 10
bloqueio heroi
aplicar regras 1`), runtime);
    const h = runtime.entidades()[0];
    expect(h.posicao).toEqual({ x: 5, y: 5 });
    expect(h.fisica).toMatchObject({ vx: 0, vy: 0, bloqueado: true });
  });

  it("rejeita restituição fora de 0..1 e atrito negativo", () => {
    const runtime = new RuntimeMemoria();
    const a = runtime.executar(parseOldRewrite(`criar personagem a
restituicao a para 1.5`).nos[0]);
    const b = runtime.executar(parseOldRewrite(`criar personagem b
atrito b para -1`).nos[0]);
    expect(a.valor).toMatchObject({ motivo: "restituicao_invalida" });
    expect(b.valor).toMatchObject({ motivo: "atrito_invalido" });
  });
});
