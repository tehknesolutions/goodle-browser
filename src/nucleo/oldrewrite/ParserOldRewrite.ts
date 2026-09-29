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

  if (comando === "quando" || comando === "when") {
    const fonte = partes[1]; const evento = partes[2]?.toLocaleLowerCase("pt-BR"); const alvo = partes[3];
    if (!fonte || !alvo || !["tocar", "toque", "touch", "touches"].includes(evento) || partes.length !== 4) throw new ErroParserOldRewrite(linha, texto.trim());
    return comLinha(criarNoSemantico("quando", "comportamento", { evento: "evento.toque", fonte, alvo }), linha);
  }

  throw new ErroParserOldRewrite(linha, texto.trim());
}

export function parseOldRewrite(fonte: string): GoodleIRPrograma {
  const linhas = fonte.split(/\r?\n/).map((texto, indice) => ({ texto, linha: indice + 1, indentada: /^\s+/.test(texto) })).filter(({ texto }) => texto.trim().length > 0);
  const nos: GoodleIRNode[] = [];

  for (let indice = 0; indice < linhas.length; indice += 1) {
    const atual = linhas[indice];
    if (atual.indentada) throw new ErroParserOldRewrite(atual.linha, atual.texto.trim());
    const no = parseLinha(atual.texto, atual.linha);

    if (no.semantica === "comportamento.reacao.quando") {
      const filhos: GoodleIRNode[] = [];
      while (indice + 1 < linhas.length && linhas[indice + 1].indentada) {
        indice += 1;
        const filha = linhas[indice];
        filhos.push(parseLinha(filha.texto, filha.linha));
      }
      no.filhos = filhos;
    }
    nos.push(no);
  }

  return { versao: "1", nos };
}
