import { resolverTermoSemantico, type FamiliaOrigem } from "../semantica/DicionarioSemantico";
import type { FamiliaIR, GoodleIRNode } from "./GoodleIR";

export class ErroSemanticoIR extends Error {
  constructor(public readonly termo: string, public readonly origem?: FamiliaOrigem) {
    super(`Não foi possível resolver semanticamente "${termo}"${origem ? ` na origem ${origem}` : ""}.`);
    this.name = "ErroSemanticoIR";
  }
}

let proximoId = 1;

export function criarNoSemantico(
  termo: string,
  familia: FamiliaIR,
  parametros?: Record<string, unknown>,
  origem?: FamiliaOrigem,
): GoodleIRNode {
  const resolucao = resolverTermoSemantico(termo, origem);
  if (!resolucao) throw new ErroSemanticoIR(termo, origem);

  return {
    id: `ir-${proximoId++}`,
    semantica: resolucao.idCanonico,
    familia,
    ...(parametros ? { parametros } : {}),
    origem: {
      familia: resolucao.origem,
      termo,
      equivalencia: resolucao.equivalencia,
    },
  };
}
