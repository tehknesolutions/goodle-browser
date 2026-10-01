import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";

describe("M79 — scene runtime", () => {
  it("registra cenas e transiciona deterministicamente", () => {
    const runtime = new RuntimeMemoria();
    const programa = parseOldRewrite(`criar cena menu
criar cena jogo
quando iniciar:
  transicionar para cena jogo`);
    new HyperKernel().executar(programa, runtime);
    expect(runtime.cenasRegistradas().map((c) => c.nome)).toEqual(["menu", "jogo"]);
    expect(runtime.cenaAtualNome()).toBe("menu");
    expect(runtime.emitir({ semantica: "evento.iniciar" }).estado).toBe("executado");
    expect(runtime.cenaAtualNome()).toBe("jogo");
  });

  it("mantém destino inexistente explícito", () => {
    const runtime = new RuntimeMemoria();
    const resultado = runtime.executar({
      id: "transicao-1",
      semantica: "cena.transicao",
      familia: "estrutura",
      parametros: { destino: "inexistente" },
    });
    expect(resultado.estado).toBe("nao_suportado");
    expect(resultado.valor).toMatchObject({ aplicado: false, motivo: "cena_nao_encontrada" });
  });
});
