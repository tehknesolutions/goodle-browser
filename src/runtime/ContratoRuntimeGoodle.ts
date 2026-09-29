import type { GoodleIRNode } from "../nucleo/ir/GoodleIR";

export type ResultadoExecucao =
  | { estado: "executado"; idNo: string; semantica: string; valor?: unknown }
  | { estado: "nao_suportado"; idNo: string; semantica: string };

export interface RuntimeGoodle {
  suporta(semantica: string): boolean;
  executar(no: GoodleIRNode): ResultadoExecucao;
}
