import { describe, expect, it } from "vitest";
import { resolverTermoSemantico } from "./DicionarioSemantico";

describe("Dicionário Semântico Goodle", () => {
  it.each(["se", "if"])("normaliza %s para a condição canônica", (termo) => {
    const resultado = resolverTermoSemantico(termo);

    expect(resultado?.idCanonico).toBe("logica.condicao.se");
    expect(resultado?.termoPtBr).toBe("se");
  });

  it.each(["senão", "senao", "else"])("normaliza %s para senão", (termo) => {
    const resultado = resolverTermoSemantico(termo);

    expect(resultado?.idCanonico).toBe("logica.condicao.senao");
    expect(resultado?.termoPtBr).toBe("senão");
  });

  it.each(["quando", "when"])("normaliza %s para reação", (termo) => {
    const resultado = resolverTermoSemantico(termo);

    expect(resultado?.idCanonico).toBe("comportamento.reacao.quando");
  });

  it("mantém Evento, Ação, Emissão e Reação como conceitos diferentes", () => {
    expect(resolverTermoSemantico("evento")?.idCanonico).toBe("comportamento.evento");
    expect(resolverTermoSemantico("ação")?.idCanonico).toBe("comportamento.acao");
    expect(resolverTermoSemantico("emitir")?.idCanonico).toBe("comportamento.emissao");
    expect(resolverTermoSemantico("quando")?.idCanonico).toBe("comportamento.reacao.quando");
  });

  it("reconhece um alias de engine sem fingir equivalência perfeita", () => {
    const signal = resolverTermoSemantico("signal", "godot");

    expect(signal?.idCanonico).toBe("comportamento.emissao");
    expect(signal?.equivalencia).toBe("contextual");
    expect(signal?.origem).toBe("godot");
  });

  it("não resolve alias contextual de engine sem origem suficiente", () => {
    expect(resolverTermoSemantico("signal")).toBeUndefined();
  });
});
