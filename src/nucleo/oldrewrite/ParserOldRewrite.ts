import { criarNoSemantico } from "../ir/criarNoSemantico";
import type { GoodleIRNode, GoodleIRPrograma } from "../ir/GoodleIR";

export class ErroParserOldRewrite extends Error {
  constructor(public readonly linha: number, public readonly texto: string) {
    super(`Comando OldRewrite desconhecido na linha ${linha}: ${texto}`);
    this.name = "ErroParserOldRewrite";
  }
}

const normalizarEspacos = (linha: string) => linha.trim().replace(/\s+/g, " ");
const numero = (valor: string | undefined): number | undefined => {
  if (valor === undefined || valor.trim() === "") return undefined;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : undefined;
};
const comLinha = (no: GoodleIRNode, linha: number): GoodleIRNode => ({ ...no, metadados: { ...(no.metadados ?? {}), linha } });

function parseLinha(texto: string, linha: number): GoodleIRNode {
  const normalizada = normalizarEspacos(texto).replace(/:$/, "");
  const partes = normalizada.split(" ");
  const comando = partes[0]?.toLocaleLowerCase("pt-BR");

  if (comando === "criar") {
    if ((partes[1]?.toLocaleLowerCase("pt-BR") === "cena" || partes[1]?.toLocaleLowerCase("pt-BR") === "scene") && partes.length >= 3) {
      return comLinha(criarNoSemantico("cena", "estrutura", { nome: partes.slice(2).join(" ") }), linha);
    }
    const tipoOriginal = partes[1]?.toLocaleLowerCase("pt-BR");
    const nome = partes.slice(2).join(" ");
    const tipo = tipoOriginal === "entity" ? "entidade" : tipoOriginal;
    if (!nome || (tipo !== "entidade" && tipo !== "personagem")) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("criar entidade", "execucao", { tipo, nome }), linha);
  }

  if (comando === "transicionar" || comando === "transition") {
    const preposicao = partes[1]?.toLocaleLowerCase("pt-BR");
    const destino = partes.slice(2).join(" ");
    if ((preposicao === "para" || preposicao === "to") && destino) {
      return comLinha(criarNoSemantico("cena.transicao", "estrutura", { destino }), linha);
    }
    throw new ErroParserOldRewrite(linha, texto.trim());
  }

  if (["ativar", "activate"].includes(comando) || ["desativar", "deactivate"].includes(comando) || ["spawn", "despawn"].includes(comando)) {
    const nome = partes.slice(1).join(" ");
    if (!nome || partes.length < 2) throw new ErroParserOldRewrite(linha, texto.trim());
    const semantica = comando === "ativar" || comando === "activate" ? "entidade.ativar" : comando === "desativar" || comando === "deactivate" ? "entidade.desativar" : comando === "spawn" ? "entidade.spawn" : "entidade.despawn";
    return comLinha(criarNoSemantico(semantica, "estrutura", { nome }), linha);
  }

  if (["velocidade", "velocity", "aceleracao", "aceleração", "acceleration", "gravidade", "gravity", "massa", "mass", "impulso", "impulse"].includes(comando)) {
    const nome = partes[1];
    const x = numero(partes[3]);
    const y = numero(partes[4]);
    const conector = partes[2]?.toLocaleLowerCase("pt-BR");
    if (!nome) throw new ErroParserOldRewrite(linha, texto.trim());
    if (["velocidade", "velocity", "aceleracao", "aceleração", "acceleration", "gravidade", "gravity"].includes(comando)) {
      if (!["para", "to"].includes(conector ?? "") || x === undefined || y === undefined || partes.length !== 5) throw new ErroParserOldRewrite(linha, texto.trim());
      const semantica = ["velocidade", "velocity"].includes(comando) ? "fisica.velocidade" : ["aceleracao", "aceleração", "acceleration"].includes(comando) ? "fisica.aceleracao" : "fisica.gravidade";
      return comLinha(criarNoSemantico(semantica, "mundo", { nome, x, y }), linha);
    }
    const valor = numero(partes[3]);
    if (!["para", "to"].includes(conector ?? "") || valor === undefined || partes.length !== 4) throw new ErroParserOldRewrite(linha, texto.trim());
    const semantica = ["massa", "mass"].includes(comando) ? "fisica.massa" : "fisica.impulso";
    return comLinha(criarNoSemantico(semantica, "mundo", { nome, ...(semantica === "fisica.massa" ? { valor } : { x: valor, y: numero(partes[4] ?? "0") ?? 0 }) }), linha);
  }

  if (comando === "coerencia" || comando === "coherence") {
    if (["colisao", "colisão", "collision"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.coerencia_colisao", "mundo", {}), linha);
  }
  if (comando === "invalidar" || comando === "invalidate") {
    if (["colisao", "colisão", "collision"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.invalidar_colisao", "mundo", {}), linha);
  }
  if (comando === "estado" || comando === "state") {
    if (["colisao", "colisão", "collision"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.estado_colisao", "mundo", {}), linha);
  }

  if (comando === "cache" || comando === "cachear") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "pares" && partes[2]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 3) return comLinha(criarNoSemantico("fisica.broadphase_pares_cache", "mundo", {}), linha);
  }
  if (comando === "atualizar" || comando === "update") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "pares" && partes[2]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 3) return comLinha(criarNoSemantico("fisica.broadphase_pares_atualizar", "mundo", {}), linha);
  }
  if (comando === "estado" || comando === "state") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "pares" && partes[2]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 3) return comLinha(criarNoSemantico("fisica.broadphase_pares_estado", "mundo", {}), linha);
  }


    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    const dt = numero(partes[2]);
    if ((tipo === "fisica" || tipo === "physics") && dt !== undefined && partes.length === 3) {
      return comLinha(criarNoSemantico("fisica.atualizar", "mundo", { dt }), linha);
    }
  }

  if (comando === "limite" || comando === "bounds") {
    const xmin = numero(partes[1]); const xmax = numero(partes[2]); const ymin = numero(partes[3]); const ymax = numero(partes[4]);
    if ([xmin, xmax, ymin, ymax].some((v) => v === undefined) || partes.length !== 5) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("fisica.limite", "mundo", { xMin: xmin, xMax: xmax, yMin: ymin, yMax: ymax }), linha);
  }
  if (comando === "superficie" || comando === "superficie") {
    const y = numero(partes[1]);
    if (y === undefined || partes.length !== 2) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("fisica.superficie", "mundo", { y }), linha);
  }
  if (comando === "atrito" || comando === "friction" || comando === "restituicao" || comando === "restituição") {
    const nome = partes[1]; const valor = numero(partes[3]); const conector = partes[2]?.toLocaleLowerCase("pt-BR");
    if (!nome || !["para", "to"].includes(conector ?? "") || valor === undefined || partes.length !== 4) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico(comando === "atrito" || comando === "friction" ? "fisica.atrito" : "fisica.restituicao", "mundo", { nome, valor }), linha);
  }
  if (comando === "bloqueio" || comando === "block") {
    const nome = partes[1];
    if (!nome || partes.length !== 2) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("fisica.bloqueio", "mundo", { nome }), linha);
  }
  if (comando === "aplicar" || comando === "apply") {
    if (["regras", "rules"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "")) {
      const dt = numero(partes[2]);
      if (dt === undefined || partes.length !== 3) throw new ErroParserOldRewrite(linha, texto.trim());
      return comLinha(criarNoSemantico("fisica.aplicar_regras", "mundo", { dt }), linha);
    }
  }

  if (comando === "atualizar" || comando === "update") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 2) return comLinha(criarNoSemantico("fisica.broadphase_atualizar", "mundo", {}), linha);
  }
  if (comando === "reconstruir" || comando === "rebuild") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 2) return comLinha(criarNoSemantico("fisica.broadphase_reconstruir", "mundo", {}), linha);
  }
  if (comando === "estado" || comando === "state") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 2) return comLinha(criarNoSemantico("fisica.broadphase_estado", "mundo", {}), linha);
  }

  if (comando === "ativar" || comando === "enable") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 2) return comLinha(criarNoSemantico("fisica.broadphase_ativar", "mundo", {}), linha);
  }
  if (comando === "desativar" || comando === "disable") {
    if (partes[1]?.toLocaleLowerCase("pt-BR") === "broadphase" && partes.length === 2) return comLinha(criarNoSemantico("fisica.broadphase_desativar", "mundo", {}), linha);
  }
  if (comando === "pares" || comando === "pairs") {
    if (["colisao", "colisão", "collision"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.pares_colisao", "mundo", {}), linha);
  }

  if (comando === "broadphase") {
    if (partes.length === 1) return comLinha(criarNoSemantico("fisica.broadphase", "mundo", {}), linha);
  }
  if (comando === "particao" || comando === "partition") {
    if (["espacial", "spatial"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.particao_espacial", "mundo", {}), linha);
  }
  if (comando === "candidatos" || comando === "candidates") {
    if (["colisao", "colisão", "collision"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.candidatos_colisao", "mundo", {}), linha);
  }

  if (comando === "evento" || comando === "event") {
    if (["acordar", "wake"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.evento_acordar", "mundo", {}), linha);
  }
  if (comando === "ilhas" || comando === "islands") {
    if (partes.length === 1) return comLinha(criarNoSemantico("fisica.ilhas", "mundo", {}), linha);
  }
  if (comando === "ativar" || comando === "activate") {
    if (["ilha", "island"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.ativar_ilha", "mundo", {}), linha);
  }
  if (comando === "estado" || comando === "state") {
    if (["ilhas", "islands"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.estado_ilhas", "mundo", {}), linha);
  }

  if (comando === "dormir" || comando === "sleep") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    if (["fisica", "physics"].includes(tipo ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.sleep", "mundo", {}), linha);
  }
  if (comando === "acordar" || comando === "wake") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    if (["fisica", "physics"].includes(tipo ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.acordar", "mundo", {}), linha);
  }
  if (comando === "estado" || comando === "state") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    if (["repouso", "rest"].includes(tipo ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.estado_repouso", "mundo", {}), linha);
  }
  if (comando === "limiar" || comando === "threshold") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    const valor = numero(partes[2]);
    if (["repouso", "rest"].includes(tipo ?? "") && valor !== undefined && partes.length === 3) return comLinha(criarNoSemantico("fisica.limiar_repouso", "mundo", { valor }), linha);
  }

  if (comando === "contatos" || comando === "contacts") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    if (["persistentes", "persistent"].includes(tipo ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.contatos_persistentes", "mundo", {}), linha);
  }
  if (comando === "resolver" || comando === "resolve") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    if (["contatos", "contacts"].includes(tipo ?? "") && ["persistentes", "persistent"].includes(partes[2]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 3) return comLinha(criarNoSemantico("fisica.resolver_contatos_persistentes", "mundo", {}), linha);
  }

  if (comando === "contatos" || comando === "contacts") {
    if (partes.length === 1) return comLinha(criarNoSemantico("fisica.contatos", "mundo", {}), linha);
  }
  if (comando === "colisao" || comando === "collision") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    if (["continua", "continuous"].includes(tipo ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.colisao_continua", "mundo", {}), linha);
  }
  if (comando === "resolver" || comando === "resolve") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    if (["contatos", "contacts"].includes(tipo ?? "") && partes.length === 2) return comLinha(criarNoSemantico("fisica.resolver_contatos", "mundo", {}), linha);
  }

  if (comando === "simular" || comando === "simulate") {
    const tipo = partes[1]?.toLocaleLowerCase("pt-BR");
    const dt = numero(partes[2]);
    if (["fisica", "physics"].includes(tipo ?? "") && dt !== undefined && partes.length === 3) {
      return comLinha(criarNoSemantico("fisica.simular", "mundo", { dt }), linha);
    }
  }

  if (comando === "iterações" || comando === "iteracoes" || comando === "iterations") {
    const valor = numero(partes[1]);
    if (valor === undefined || partes.length !== 2) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("fisica.iteracoes", "mundo", { valor }), linha);
  }

  if (comando === "resolver" || comando === "resolve") {
    if (["colisões", "colisoes", "collisions"].includes(partes[1]?.toLocaleLowerCase("pt-BR") ?? "") && partes.length === 2) {
      return comLinha(criarNoSemantico("fisica.colisao_resolver", "mundo", {}), linha);
    }
  }

  if (comando === "definir" || comando === "define") {
    const forma = partes[1]?.toLocaleLowerCase("pt-BR");
    const preposicao = partes[2]?.toLocaleLowerCase("pt-BR");
    const nome = partes[3];
    const detalhe = partes[4]?.toLocaleLowerCase("pt-BR");
    const a = numero(partes[5]);
    const b = numero(partes[6] ?? partes[5]);
    if (forma === "ponto" || forma === "point") {
      if (!nome || !["de", "of"].includes(preposicao ?? "") || partes.length !== 4) throw new ErroParserOldRewrite(linha, texto.trim());
      return comLinha(criarNoSemantico("definir ponto", "mundo", { nome }), linha);
    }
    if ((forma === "circulo" || forma === "círculo" || forma === "circle") && nome && ["de", "of"].includes(preposicao ?? "") && ["raio", "radius"].includes(detalhe ?? "") && a !== undefined && partes.length === 6) {
      return comLinha(criarNoSemantico("definir círculo", "mundo", { nome, raio: a }), linha);
    }
    if ((forma === "retangulo" || forma === "retângulo" || forma === "rectangle") && nome && ["de", "of"].includes(preposicao ?? "") && a !== undefined && b !== undefined && partes.length === 7) {
      return comLinha(criarNoSemantico("definir retângulo", "mundo", { nome, largura: a, altura: b }), linha);
    }
    throw new ErroParserOldRewrite(linha, texto.trim());
  }

  if (comando === "posicionar" || comando === "position") {
    const nome = partes[1]; const conector = partes[2]?.toLocaleLowerCase("pt-BR"); const x = numero(partes[3]); const y = numero(partes[4]);
    if (!nome || !["em", "at"].includes(conector) || x === undefined || y === undefined || partes.length !== 5) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("posição", "mundo", { nome, x, y }), linha);
  }

  if (comando === "mover" || comando === "move") {
    const nome = partes[1]; const conector = partes[2]?.toLocaleLowerCase("pt-BR"); const x = numero(partes[3]); const y = numero(partes[4]);
    if (!nome || !["por", "by"].includes(conector) || x === undefined || y === undefined || partes.length !== 5) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("movimento", "mundo", { nome, x, y }), linha);
  }

  if (comando === "rotacionar" || comando === "rotate") {
    const nome = partes[1]; const conector = partes[2]?.toLocaleLowerCase("pt-BR"); const graus = numero(partes[3]);
    if (!nome || !["para", "to"].includes(conector) || graus === undefined || partes.length !== 4) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("rotacao", "mundo", { nome, graus }), linha);
  }

  if (comando === "escalar" || comando === "scale") {
    const nome = partes[1]; const conector = partes[2]?.toLocaleLowerCase("pt-BR"); const sx = numero(partes[3]); const sy = numero(partes[4] ?? partes[3]);
    if (!nome || !["para", "to"].includes(conector) || sx === undefined || sy === undefined || partes.length < 4 || partes.length > 5) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("escala", "mundo", { nome, x: sx, y: sy }), linha);
  }

  if (comando === "definir" || comando === "set") {
    const propriedade = partes[1];
    const conectorEntidade = partes[2]?.toLocaleLowerCase("pt-BR");
    const entidade = partes[3];
    const conectorValor = partes[4]?.toLocaleLowerCase("pt-BR");
    const valor = numero(partes[5]);
    if (!propriedade || !entidade || !["de", "of"].includes(conectorEntidade) || !["como", "to", "as"].includes(conectorValor) || valor === undefined || partes.length !== 6) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("definir", "dados", { entidade, propriedade, valor }), linha);
  }

  if (comando === "diminuir" || comando === "decrease") {
    const propriedade = partes[1];
    const conectorEntidade = partes[2]?.toLocaleLowerCase("pt-BR");
    const entidade = partes[3];
    const conectorValor = partes[4]?.toLocaleLowerCase("pt-BR");
    const valor = numero(partes[5]);
    if (!propriedade || !entidade || !["de", "of"].includes(conectorEntidade) || !["em", "by"].includes(conectorValor) || valor === undefined || partes.length !== 6) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("diminuir", "comportamento", { entidade, propriedade, valor }), linha);
  }

  if (comando === "aumentar" || comando === "increase") {
    const propriedade = partes[1];
    const conectorEntidade = partes[2]?.toLocaleLowerCase("pt-BR");
    const entidade = partes[3];
    const conectorValor = partes[4]?.toLocaleLowerCase("pt-BR");
    const valor = numero(partes[5]);
    if (!propriedade || !entidade || !["de", "of"].includes(conectorEntidade) || !["em", "by"].includes(conectorValor) || valor === undefined || partes.length !== 6) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("aumentar", "comportamento", { entidade, propriedade, valor }), linha);
  }

  if (comando === "se" || comando === "if") {
    const sujeitoEspacial = partes[1];
    const relacaoEspacial = partes[2]?.toLocaleLowerCase("pt-BR");
    const objetoEspacial = partes[3];
    const relacoes = new Set(["colidir", "collide", "sobrepor", "overlap", "perto", "near", "dentro", "inside", "fora", "outside"]);
    if (sujeitoEspacial && objetoEspacial && relacoes.has(relacaoEspacial ?? "")) {
      const mapa: Record<string, string> = {
        colidir: "espaco.colisao", collide: "espaco.colisao",
        sobrepor: "espaco.sobreposicao", overlap: "espaco.sobreposicao",
        perto: "espaco.perto", near: "espaco.perto",
        dentro: "espaco.dentro", inside: "espaco.dentro",
        fora: "espaco.fora", outside: "espaco.fora",
      };
      return comLinha(criarNoSemantico("se", "comportamento", { relacao: mapa[relacaoEspacial], sujeito: sujeitoEspacial, objeto: objetoEspacial }), linha);
    }
  }

  if (comando === "se" || comando === "if") {
    const propriedade = partes[1];
    const conectorEntidade = partes[2]?.toLocaleLowerCase("pt-BR");
    const entidade = partes[3];
    const comparador = partes[4]?.toLocaleLowerCase("pt-BR");
    const comparadorSegundo = partes[5]?.toLocaleLowerCase("pt-BR");
    const valor = numero(partes[6]);
    const operador = (comparador === "maior" && comparadorSegundo === "que") || (comparador === "greater" && comparadorSegundo === "than") ? "maior_que" : (comparador === "menor" && comparadorSegundo === "que") || (comparador === "less" && comparadorSegundo === "than") ? "menor_que" : comparador === "igual" || comparador === "equals" ? "igual" : undefined;
    if (!propriedade || !entidade || !["de", "of"].includes(conectorEntidade) || !operador || valor === undefined || partes.length !== 7) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("se", "comportamento", { entidade, propriedade, operador, valor }), linha);
  }

  if (comando === "quando" || comando === "when") {
    const temporal = partes[1]?.toLocaleLowerCase("pt-BR");
    const duracaoTemporal = numero(partes[2]);

    if ((temporal === "temporizador" || temporal === "timer" || temporal === "timeout") && duracaoTemporal !== undefined && partes.length === 3) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.temporizador.disparar", duracaoMs: duracaoTemporal }), linha);
    }
    if ((temporal === "intervalo" || temporal === "interval" || temporal === "a_cada") && duracaoTemporal !== undefined && partes.length === 3) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.tempo.intervalo", duracaoMs: duracaoTemporal }), linha);
    }
    if ((temporal === "esperar" || temporal === "wait") && duracaoTemporal !== undefined && partes.length === 3) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.tempo.esperar", duracaoMs: duracaoTemporal }), linha);
    }
    const primeiro = partes[1]?.toLocaleLowerCase("pt-BR");
    if ((primeiro === "iniciar" || primeiro === "start") && partes.length === 2) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.iniciar" }), linha);
    }
    if ((primeiro === "atualizar" || primeiro === "update") && partes.length === 2) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.atualizar" }), linha);
    }

    const acaoInput = partes[1]?.toLocaleLowerCase("pt-BR");
    const tipoInput = partes[2]?.toLocaleLowerCase("pt-BR");
    const identificadorInput = partes.slice(3).join(" ");

    if ((acaoInput === "pressionar" || acaoInput === "press") && (tipoInput === "tecla" || tipoInput === "key") && identificadorInput) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.tecla.pressionar", codigo: identificadorInput }), linha);
    }
    if ((acaoInput === "soltar" || acaoInput === "release") && (tipoInput === "tecla" || tipoInput === "key") && identificadorInput) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.tecla.soltar", codigo: identificadorInput }), linha);
    }
    if ((acaoInput === "clicar" || acaoInput === "click") && identificadorInput) {
      return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.clique", alvo: identificadorInput }), linha);
    }

    const fonte = partes[1]; const evento = partes[2]?.toLocaleLowerCase("pt-BR"); const alvo = partes[3];
    if (!fonte || !alvo || !["tocar", "toque", "touch", "touches"].includes(evento) || partes.length !== 4) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.toque", fonte, alvo }), linha);
  }

  throw new ErroParserOldRewrite(linha, texto.trim());
}

export function parseOldRewrite(fonte: string): GoodleIRPrograma {
  const linhasBrutas = fonte.split(/\r?\n/);
  const linhasNaoVazias = linhasBrutas.map((texto, indice) => ({ texto, linha: indice + 1, largura: texto.match(/^\\s*/)?.[0].length ?? 0 })).filter(({ texto }) => texto.trim().length > 0);
  const indentacaoBase = linhasNaoVazias.reduce((minimo, item) => Math.min(minimo, item.largura), Number.POSITIVE_INFINITY);
  const base = Number.isFinite(indentacaoBase) ? indentacaoBase : 0;
  const linhas = linhasNaoVazias.map(({ texto, linha, largura }) => ({ texto: texto.slice(Math.min(base, largura)), linha, largura: Math.max(0, largura - base) }));

  function bloco(inicio: number, nivel: number): { nos: GoodleIRNode[]; proximo: number } {
    const nos: GoodleIRNode[] = [];
    let indice = inicio;
    while (indice < linhas.length) {
      const atual = linhas[indice];
      if (atual.largura < nivel) break;
      if (atual.largura > nivel) throw new ErroParserOldRewrite(atual.linha, atual.texto.trim());
      const no = parseLinha(atual.texto, atual.linha);
      indice += 1;
      if (indice < linhas.length && linhas[indice].largura > nivel) {
        const filhoNivel = linhas[indice].largura;
        const filhos = bloco(indice, filhoNivel);
        no.filhos = filhos.nos;
        indice = filhos.proximo;
      }
      nos.push(no);
    }
    return { nos, proximo: indice };
  }

  return { versao: "1", nos: bloco(0, 0).nos };
}
