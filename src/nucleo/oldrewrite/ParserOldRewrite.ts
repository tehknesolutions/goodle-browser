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

function parseLinha(texto: string, linha: number): GoodleIRNode {
  const normalizada = normalizarEspacos(texto);
  const partes = normalizada.split(" ");
  const comando = partes[0]?.toLocaleLowerCase("pt-BR");

  if (comando === "criar") {
    const tipoOriginal = partes[1]?.toLocaleLowerCase("pt-BR");
    const nome = partes.slice(2).join(" ");
    const tipo = tipoOriginal === "entity" ? "entidade" : tipoOriginal;
    if (!nome || (tipo !== "entidade" && tipo !== "personagem")) throw new ErroParserOldRewrite(linha, texto.trim());
    const no = criarNoSemantico("criar entidade", "execucao", { tipo, nome });
    return { ...no, metadados: { ...(no.metadados ?? {}), linha } };
  }

  if (comando === "posicionar" || comando === "position") {
    const nome = partes[1];
    const conector = partes[2]?.toLocaleLowerCase("pt-BR");
    const x = numero(partes[3]);
    const y = numero(partes[4]);
    if (!nome || !["em", "at"].includes(conector) || x === undefined || y === undefined || partes.length !== 5) throw new ErroParserOldRewrite(linha, texto.trim());
    const no = criarNoSemantico("posição", "mundo", { nome, x, y });
    return { ...no, metadados: { ...(no.metadados ?? {}), linha } };
  }

  if (comando === "mover" || comando === "move") {
    const nome = partes[1];
    const conector = partes[2]?.toLocaleLowerCase("pt-BR");
    const x = numero(partes[3]);
    const y = numero(partes[4]);
    if (!nome || !["por", "by"].includes(conector) || x === undefined || y === undefined || partes.length !== 5) throw new ErroParserOldRewrite(linha, texto.trim());
    const no = criarNoSemantico("movimento", "mundo", { nome, x, y });
    return { ...no, metadados: { ...(no.metadados ?? {}), linha } };
  }

  throw new ErroParserOldRewrite(linha, texto.trim());
}

export function parseOldRewrite(fonte: string): GoodleIRPrograma {
  const nos = fonte.split(/\r?\n/).map((texto, indice) => ({ texto, linha: indice + 1 })).filter(({ texto }) => texto.trim().length > 0).map(({ texto, linha }) => parseLinha(texto, linha));
  return { versao: "1", nos };
}
