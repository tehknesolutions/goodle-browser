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
    expect(resolverTermoSemantico(termo)?.idCanonico).toBe("comportamento.reacao.quando");
  });

  it("mantém Evento, Ação, Emissão e Reação como conceitos diferentes", () => {
    expect(resolverTermoSemantico("evento")?.idCanonico).toBe("comportamento.evento");
    expect(resolverTermoSemantico("ação")?.idCanonico).toBe("comportamento.acao");
    expect(resolverTermoSemantico("emitir")?.idCanonico).toBe("comportamento.emissao");
    expect(resolverTermoSemantico("quando")?.idCanonico).toBe("comportamento.reacao.quando");
  });

  it("reconhece signal do Godot sem fingir equivalência perfeita", () => {
    const signal = resolverTermoSemantico("signal", "godot");
    expect(signal?.idCanonico).toBe("comportamento.emissao");
    expect(signal?.equivalencia).toBe("contextual");
    expect(signal?.origem).toBe("godot");
  });

  it("não resolve aliases contextuais sem origem suficiente", () => {
    for (const termo of ["signal", "proc", "common event", "ready", "collider", "route"]) {
      expect(resolverTermoSemantico(termo)).toBeUndefined();
    }
  });

  it.each([
    ["node", "godot", "estrutura.entidade"], ["scene", "godot", "estrutura.cena"],
    ["resource", "godot", "estrutura.recurso"], ["game object", "phaser", "estrutura.entidade"],
    ["scene", "phaser", "estrutura.cena"], ["camera", "phaser", "mundo.camera"],
    ["atom", "byond", "estrutura.entidade"], ["mob", "byond", "mundo.personagem"],
    ["obj", "byond", "mundo.objeto"], ["turf", "byond", "mundo.terreno"],
    ["area", "byond", "estrutura.area"], ["world", "byond", "estrutura.mundo"],
    ["map", "rpg-maker", "estrutura.mapa"], ["switch", "rpg-maker", "dados.estado"],
    ["variable", "rpg-maker", "dados.dado"],
  ] as const)("mapeia %s (%s) para %s", (termo, origem, id) => {
    expect(resolverTermoSemantico(termo, origem)?.idCanonico).toBe(id);
  });

  it("distingue proc e verb do BYOND por intenção", () => {
    expect(resolverTermoSemantico("proc", "byond")?.idCanonico).toBe("comportamento.acao");
    expect(resolverTermoSemantico("verb", "byond")?.idCanonico).toBe("comportamento.acao.usuario");
  });

  it("mapeia Event do RPG Maker como conceito contextual de evento", () => {
    const evento = resolverTermoSemantico("event", "rpg-maker");
    expect(evento?.idCanonico).toBe("comportamento.evento");
    expect(evento?.equivalencia).toBe("contextual");
  });

  it("preserva a origem solicitada quando um termo canônico Goodle é usado", () => {
    expect(resolverTermoSemantico("se", "goodle")?.origem).toBe("goodle");
  });

  it.each([
    ["loop", "rpg-maker", "logica.repeticao"], ["break loop", "rpg-maker", "logica.repeticao.parar"],
    ["input", "godot", "sistema.entrada"], ["input", "phaser", "sistema.entrada"],
    ["physics", "phaser", "sistema.fisica"], ["animation", "phaser", "sistema.animacao"],
    ["animationplayer", "godot", "sistema.animacao"], ["event page", "rpg-maker", "comportamento.evento.pagina"],
    ["common event", "rpg-maker", "comportamento.acao.compartilhada"], ["database", "rpg-maker", "dados.base"],
    ["client", "byond", "sistema.cliente"], ["savefile", "byond", "persistencia.arquivo"],
    ["list", "byond", "dados.lista"], ["preload", "godot", "estrutura.recurso.precarregar"],
  ] as const)("segunda onda: %s (%s) converge para %s", (termo, origem, id) => {
    expect(resolverTermoSemantico(termo, origem)?.idCanonico).toBe(id);
  });

  it.each([
    ["repetir", "logica.repeticao"], ["parar repetição", "logica.repeticao.parar"],
    ["entrada", "sistema.entrada"], ["física", "sistema.fisica"], ["animacao", "sistema.animacao"],
    ["lista", "dados.lista"], ["banco", "dados.base"], ["cliente", "sistema.cliente"],
  ] as const)("oferece termo Goodle PT-BR %s para %s", (termo, id) => {
    expect(resolverTermoSemantico(termo)?.idCanonico).toBe(id);
  });

  it.each([
    ["function", "typescript", "comportamento.funcao"], ["component", "react", "estrutura.componente"],
    ["ready", "godot", "ciclo.pronto"], ["update", "phaser", "ciclo.atualizar"],
    ["collider", "phaser", "fisica.colisao"], ["timer", "godot", "tempo.temporizador"],
    ["sound", "phaser", "midia.audio"], ["control", "godot", "interface.elemento"],
    ["show text", "rpg-maker", "narrativa.dialogo"], ["change items", "rpg-maker", "jogo.inventario"],
    ["route", "backend", "backend.rota"], ["database", "backend", "backend.persistencia"],
    ["websocket", "backend", "rede.tempo_real"], ["server", "byond", "rede.servidor"],
  ] as const)("terceira onda: %s (%s) converge para %s", (termo, origem, id) => {
    expect(resolverTermoSemantico(termo, origem)?.idCanonico).toBe(id);
  });

  it.each([
    ["função", "comportamento.funcao"], ["componente", "estrutura.componente"],
    ["pronto", "ciclo.pronto"], ["atualizar", "ciclo.atualizar"], ["colisão", "fisica.colisao"],
    ["temporizador", "tempo.temporizador"], ["áudio", "midia.audio"], ["interface", "interface.elemento"],
    ["diálogo", "narrativa.dialogo"], ["inventário", "jogo.inventario"], ["rota", "backend.rota"],
    ["persistência", "backend.persistencia"], ["tempo real", "rede.tempo_real"], ["servidor", "rede.servidor"],
  ] as const)("terceira onda oferece termo PT-BR %s para %s", (termo, id) => {
    expect(resolverTermoSemantico(termo)?.idCanonico).toBe(id);
  });
});
