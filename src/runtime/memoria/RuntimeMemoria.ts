import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import type { ResultadoExecucao, RuntimeGoodle } from "../ContratoRuntimeGoodle";

export type EntidadeMemoria = {
  nome: string;
  tipo: string;
  posicao?: { x: number; y: number };
};

export class RuntimeMemoria implements RuntimeGoodle {
  private readonly estadoEntidades: EntidadeMemoria[] = [];

  suporta(semantica: string): boolean {
    return ["entidade.criar", "espaco.posicao", "espaco.movimento"].includes(semantica);
  }

  executar(no: GoodleIRNode): ResultadoExecucao {
    if (!this.suporta(no.semantica)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };

    if (no.semantica === "entidade.criar") {
      const nome = String(no.parametros?.nome ?? "");
      const tipo = String(no.parametros?.tipo ?? "entidade");
      this.estadoEntidades.push({ nome, tipo });
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { nome, tipo } };
    }

    const nome = String(no.parametros?.nome ?? "");
    const entidade = this.estadoEntidades.find((item) => item.nome === nome);
    if (!entidade) return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "entidade_nao_encontrada", nome } };

    const x = Number(no.parametros?.x ?? 0);
    const y = Number(no.parametros?.y ?? 0);
    if (no.semantica === "espaco.posicao") entidade.posicao = { x, y };
    if (no.semantica === "espaco.movimento") {
      const atual = entidade.posicao ?? { x: 0, y: 0 };
      entidade.posicao = { x: atual.x + x, y: atual.y + y };
    }

    return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, posicao: entidade.posicao } };
  }

  entidades(): EntidadeMemoria[] {
    return this.estadoEntidades.map((entidade) => ({ ...entidade, ...(entidade.posicao ? { posicao: { ...entidade.posicao } } : {}) }));
  }
}
