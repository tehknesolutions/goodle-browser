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
    const tipoOriginal = partes[1]?.toLocaleLowerCase("pt-BR");
    const nome = partes.slice(2).join(" ");
    const tipo = tipoOriginal === "entity" ? "entidade" : tipoOriginal;
    if (!nome || (tipo !== "entidade" && tipo !== "personagem")) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("criar entidade", "execucao", { tipo, nome }), linha);
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
