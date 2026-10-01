import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M81 — spatial runtime", () => {
  it("mantém transformação espacial determinística", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
posicionar heroi em 10 20
mover heroi por 5 3
rotacionar heroi para 90
escalar heroi para 2 2`);
    new HyperKernel().executar(programa, runtime);
    const heroi = runtime.entidades()[0];
    expect(heroi.posicao).toEqual({ x: 15, y: 23 });
    expect(heroi.rotacao).toBe(90);
    expect(heroi.escala).toEqual({ x: 2, y: 2 });
  });

  it("mantém M80 ativo junto da transformação", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
desativar heroi
posicionar heroi em 10 20`);
    new HyperKernel().executar(programa, runtime);
    expect(runtime.entidades()[0]).toMatchObject({ ativo: false, posicao: { x: 10, y: 20 } });
  });
});
