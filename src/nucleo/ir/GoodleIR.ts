import type { FamiliaOrigem, NivelEquivalencia } from "../semantica/DicionarioSemantico";

export type FamiliaIR = "estrutura" | "dados" | "comportamento" | "mundo" | "execucao";

export type OrigemIR = {
  familia: FamiliaOrigem;
  termo?: string;
  equivalencia?: NivelEquivalencia;
};

export type GoodleIRNode = {
  id: string;
  semantica: string;
  familia: FamiliaIR;
  parametros?: Record<string, unknown>;
  filhos?: GoodleIRNode[];
  origem?: OrigemIR;
  metadados?: Record<string, unknown>;
};

export type GoodleIRPrograma = {
  versao: "1";
  nos: GoodleIRNode[];
};
