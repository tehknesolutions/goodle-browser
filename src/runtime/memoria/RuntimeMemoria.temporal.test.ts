import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M78 — temporal runtime", () => {
  it("dispara timeout deterministicamente por duração", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
definir vida de heroi como 100
quando temporizador 1000:
  aumentar vida de heroi em 10`);
    new HyperKernel().executar(programa, runtime);
    const resultado = runtime.emitir({ semantica: "evento.temporizador.disparar", duracaoMs: 1000 });
    expect(resultado.estado).toBe("executado");
    expect(runtime.entidades()[0].propriedades?.vida).toBe(110);
  });

  it("dispara intervalo deterministicamente", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
definir pontos de heroi como 0
quando intervalo 5000:
  aumentar pontos de heroi em 1`);
    new HyperKernel().executar(programa, runtime);
    runtime.emitir({ semantica: "evento.tempo.intervalo", duracaoMs: 5000 });
    runtime.emitir({ semantica: "evento.tempo.intervalo", duracaoMs: 5000 });
    expect(runtime.entidades()[0].propriedades?.pontos).toBe(2);
  });

  it("mantém temporal desconhecido explícito", () => {
    const runtime = new RuntimeMemoria();
    expect(runtime.emitir({ semantica: "evento.tempo.inexistente" }).estado).toBe("evento_desconhecido");
  });
});
