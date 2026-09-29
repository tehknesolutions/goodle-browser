import { describe, expect, it } from "vitest";
import { resolverTermoSemantico } from "./DicionarioSemantico";

describe("Dicionário Semântico Goodle", () => {
  it.each(["se", "if"])("normaliza %s para a condição canônica", (termo) => {
    expect(resolverTermoSemantico(termo)?.idCanonico).toBe("logica.condicao.se");
  });
  it.each(["senão", "senao", "else"])("normaliza %s para senão", (termo) => {
    expect(resolverTermoSemantico(termo)?.idCanonico).toBe("logica.condicao.senao");
  });
  it("mantém Evento, Ação, Emissão e Reação diferentes", () => {
    expect(resolverTermoSemantico("evento")?.idCanonico).toBe("comportamento.evento");
    expect(resolverTermoSemantico("ação")?.idCanonico).toBe("comportamento.acao");
    expect(resolverTermoSemantico("emitir")?.idCanonico).toBe("comportamento.emissao");
    expect(resolverTermoSemantico("quando")?.idCanonico).toBe("comportamento.reacao.quando");
  });
  it("não resolve aliases contextuais sem origem suficiente", () => {
    for (const termo of ["signal", "proc", "common event", "ready", "collider", "route", "instantiate", "tilemap"]) {
      expect(resolverTermoSemantico(termo)).toBeUndefined();
    }
  });

  it.each([
    ["node", "godot", "estrutura.entidade"], ["scene", "godot", "estrutura.cena"],
    ["game object", "phaser", "estrutura.entidade"], ["atom", "byond", "estrutura.entidade"],
    ["event", "rpg-maker", "comportamento.evento"], ["proc", "byond", "comportamento.acao"],
    ["signal", "godot", "comportamento.emissao"], ["common event", "rpg-maker", "comportamento.acao.compartilhada"],
    ["function", "typescript", "comportamento.funcao"], ["component", "react", "estrutura.componente"],
    ["collider", "phaser", "fisica.colisao"], ["route", "backend", "backend.rota"],
  ] as const)("mantém ponte existente: %s (%s) -> %s", (termo, origem, id) => {
    expect(resolverTermoSemantico(termo, origem)?.idCanonico).toBe(id);
  });

  it.each([
    ["property", "typescript", "dados.propriedade"], ["array", "typescript", "dados.lista"],
    ["record", "typescript", "dados.dicionario"], ["extends", "typescript", "modelo.heranca"],
    ["children", "react", "modelo.composicao"], ["instantiate", "godot", "entidade.criar"],
    ["queue_free", "godot", "entidade.destruir"], ["add_child", "godot", "hierarquia.adicionar_filho"],
    ["parent", "godot", "hierarquia.pai"], ["transform", "godot", "espaco.transformacao"],
    ["position", "phaser", "espaco.posicao"], ["sprite", "phaser", "visual.sprite"],
    ["tilemap", "phaser", "visual.tilemap"], ["follow", "phaser", "camera.seguir"],
    ["pathfinding", "godot", "navegacao.caminho"], ["state", "goodle", "jogo.estado"],
    ["change map", "rpg-maker", "cena.transicao"],
  ] as const)("quarta onda: %s (%s) converge para %s", (termo, origem, id) => {
    expect(resolverTermoSemantico(termo, origem)?.idCanonico).toBe(id);
  });

  it.each([
    ["propriedade", "dados.propriedade"], ["dicionário", "dados.dicionario"],
    ["herança", "modelo.heranca"], ["composição", "modelo.composicao"],
    ["criar entidade", "entidade.criar"], ["destruir entidade", "entidade.destruir"],
    ["adicionar filho", "hierarquia.adicionar_filho"], ["pai", "hierarquia.pai"],
    ["transformação", "espaco.transformacao"], ["posição", "espaco.posicao"],
    ["sprite", "visual.sprite"], ["mapa de tiles", "visual.tilemap"],
    ["seguir câmera", "camera.seguir"], ["encontrar caminho", "navegacao.caminho"],
    ["estado de jogo", "jogo.estado"], ["transição de cena", "cena.transicao"],
  ] as const)("quarta onda oferece PT-BR %s para %s", (termo, id) => {
    expect(resolverTermoSemantico(termo)?.idCanonico).toBe(id);
  });

  it.each([
    ["tocar", "evento.toque"],
    ["touch", "evento.toque"],
    ["definir", "dados.valor.definir"],
    ["set", "dados.valor.definir"],
    ["diminuir", "dados.valor.diminuir"],
    ["decrease", "dados.valor.diminuir"],
  ] as const)("modelo reativo: %s converge para %s", (termo, id) => {
    expect(resolverTermoSemantico(termo)?.idCanonico).toBe(id);
  });

  it("não inventa evento desconhecido", () => {
    expect(resolverTermoSemantico("teletransportar-evento-desconhecido")).toBeUndefined();
  });
});
