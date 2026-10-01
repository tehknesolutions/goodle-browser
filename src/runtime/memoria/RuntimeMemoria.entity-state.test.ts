import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M80 — entity state runtime", () => {
  it("executa ciclo ativo/inativo", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
desativar heroi
ativar heroi`);
    new HyperKernel().executar(programa, runtime);
    expect(runtime.entidades()[0].ativo).toBe(true);
  });

  it("executa spawn/despawn determinísticos", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`spawn inimigo
despawn inimigo`);
    new HyperKernel().executar(programa, runtime);
    expect(runtime.entidades()).toEqual([]);
  });

  it("preserva estado lógico após cena", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar cena menu
criar cena jogo
criar personagem heroi
quando iniciar:
  transicionar para cena jogo`);
    new HyperKernel().executar(programa, runtime);
    runtime.emitir({ semantica: "evento.iniciar" });
    expect(runtime.cenaAtualNome()).toBe("jogo");
    expect(runtime.entidades()[0].nome).toBe("heroi");
  });
});
