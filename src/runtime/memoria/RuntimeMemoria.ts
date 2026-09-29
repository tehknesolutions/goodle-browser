import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import type { ResultadoExecucao, RuntimeGoodle } from "../ContratoRuntimeGoodle";

export type EntidadeMemoria = {
  nome: string;
  tipo: string;
};

export class RuntimeMemoria implements RuntimeGoodle {
  private readonly estadoEntidades: EntidadeMemoria[] = [];

  suporta(semantica: string): boolean {
    return semantica === "entidade.criar";
  }

  executar(no: GoodleIRNode): ResultadoExecucao {
    if (!this.suporta(no.semantica)) {
      return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };
    }

    const nome = String(no.parametros?.nome ?? "");
    const tipo = String(no.parametros?.tipo ?? "entidade");
    this.estadoEntidades.push({ nome, tipo });

    return {
      estado: "executado",
      idNo: no.id,
      semantica: no.semantica,
      valor: { nome, tipo },
    };
  }

  entidades(): EntidadeMemoria[] {
    return this.estadoEntidades.map((entidade) => ({ ...entidade }));
  }
}
