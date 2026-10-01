import { describe, expect, it } from "vitest";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
import { HyperKernel } from "../HyperKernel";

describe("M75 — execução condicional", () => {
  function preparar(vida: number) {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar personagem heroi
criar personagem inimigo
definir vida de heroi como ${vida}
quando heroi tocar inimigo:
  se vida de heroi maior que 0:
    diminuir vida de heroi em 10`);
    new HyperKernel().executar(programa, runtime);
    return runtime;
  }

  it("executa ação quando condição é verdadeira", () => {
    const runtime = preparar(100);
    expect(runtime.emitir({ semantica: "evento.toque", fonte: "heroi", alvo: "inimigo" }).estado).toBe("executado");
    expect(runtime.entidades().find((e) => e.nome === "heroi")?.propriedades?.vida).toBe(90);
  });

  it("não executa ação quando condição é falsa", () => {
    const runtime = preparar(0);
    expect(runtime.emitir({ semantica: "evento.toque", fonte: "heroi", alvo: "inimigo" }).estado).toBe("executado");
    expect(runtime.entidades().find((e) => e.nome === "heroi")?.propriedades?.vida).toBe(0);
  });
});
