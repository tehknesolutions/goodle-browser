import { criarNoSemantico } from "../ir/criarNoSemantico";
import type { GoodleIRNode, GoodleIRPrograma } from "../ir/GoodleIR";

export class ErroParserOldRewrite extends Error {
  constructor(public readonly linha: number, public readonly texto: string) {
    super(`Comando OldRewrite desconhecido na linha ${linha}: ${texto}`);
    this.name = "ErroParserOldRewrite";
  }
}

const normalizarEspacos = (linha: string) => linha.trim().replace(/\s+/g, " ");

function parseLinha(texto: string, linha: number): GoodleIRNode {
  const normalizada = normalizarEspacos(texto);
  const partes = normalizada.split(" ");
  const comando = partes[0]?.toLocaleLowerCase("pt-BR");
  const tipoOriginal = partes[1]?.toLocaleLowerCase("pt-BR");
  const nome = partes.slice(2).join(" ");

  const tipo = tipoOriginal === "entity" ? "entidade" : tipoOriginal;
  if (comando !== "criar" || !nome || (tipo !== "entidade" && tipo !== "personagem")) {
    throw new ErroParserOldRewrite(linha, texto.trim());
  }

  const no = criarNoSemantico("criar entidade", "execucao", { tipo, nome });
  return { ...no, metadados: { ...(no.metadados ?? {}), linha } };
}

export function parseOldRewrite(fonte: string): GoodleIRPrograma {
  const nos = fonte
    .split(/\r?\n/)
    .map((texto, indice) => ({ texto, linha: indice + 1 }))
    .filter(({ texto }) => texto.trim().length > 0)
    .map(({ texto, linha }) => parseLinha(texto, linha));

  return { versao: "1", nos };
}
