import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import type { ResultadoExecucao, RuntimeGoodle } from "../ContratoRuntimeGoodle";

export type EntidadeMemoria = {
  nome: string;
  tipo: string;
  posicao?: { x: number; y: number };
  propriedades?: Record<string, number>;
};
export type EventoRuntimeGoodle = { semantica: string; fonte: string; alvo?: string };
export type EstadoEventoGoodle = "executado" | "evento_desconhecido" | "entidade_nao_encontrada" | "propriedade_nao_encontrada";
export type ResultadoEventoGoodle = { estado: EstadoEventoGoodle; evento: EventoRuntimeGoodle; acoesExecutadas?: number; detalhe?: string };

export class RuntimeMemoria implements RuntimeGoodle {
  private readonly estadoEntidades: EntidadeMemoria[] = [];
  private readonly comportamentos: GoodleIRNode[] = [];

  suporta(semantica: string): boolean {
    return ["entidade.criar", "espaco.posicao", "espaco.movimento", "dados.valor.definir", "dados.valor.diminuir", "comportamento.reacao.quando"].includes(semantica);
  }

  executar(no: GoodleIRNode): ResultadoExecucao {
    if (!this.suporta(no.semantica)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };

    if (no.semantica === "entidade.criar") {
      const nome = String(no.parametros?.nome ?? ""); const tipo = String(no.parametros?.tipo ?? "entidade");
      this.estadoEntidades.push({ nome, tipo });
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { nome, tipo } };
    }
    if (no.semantica === "comportamento.reacao.quando") return this.registrar(no);

    const nome = String(no.parametros?.nome ?? no.parametros?.entidade ?? "");
    const entidade = this.estadoEntidades.find((item) => item.nome === nome);
    if (!entidade) return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "entidade_nao_encontrada", nome } };

    if (no.semantica === "dados.valor.definir") {
      const propriedade = String(no.parametros?.propriedade ?? ""); const valor = Number(no.parametros?.valor);
      entidade.propriedades ??= {}; entidade.propriedades[propriedade] = valor;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, propriedade, valor } };
    }
    if (no.semantica === "dados.valor.diminuir") {
      const propriedade = String(no.parametros?.propriedade ?? ""); const valor = Number(no.parametros?.valor);
      if (!entidade.propriedades || entidade.propriedades[propriedade] === undefined) return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "propriedade_nao_encontrada", nome, propriedade } };
      entidade.propriedades[propriedade] -= valor;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, propriedade, valor: entidade.propriedades[propriedade] } };
    }

    const x = Number(no.parametros?.x ?? 0); const y = Number(no.parametros?.y ?? 0);
    if (no.semantica === "espaco.posicao") entidade.posicao = { x, y };
    if (no.semantica === "espaco.movimento") { const atual = entidade.posicao ?? { x: 0, y: 0 }; entidade.posicao = { x: atual.x + x, y: atual.y + y }; }
    return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, posicao: entidade.posicao } };
  }

  registrar(comportamento: GoodleIRNode): ResultadoExecucao {
    if (comportamento.semantica !== "comportamento.reacao.quando") return { estado: "nao_suportado", idNo: comportamento.id, semantica: comportamento.semantica };
    this.comportamentos.push(comportamento);
    return { estado: "executado", idNo: comportamento.id, semantica: comportamento.semantica, valor: { registrado: true } };
  }

  emitir(evento: EventoRuntimeGoodle): ResultadoEventoGoodle {
    if (evento.semantica !== "evento.toque") return { estado: "evento_desconhecido", evento };
    if (!this.estadoEntidades.some((e) => e.nome === evento.fonte) || (evento.alvo && !this.estadoEntidades.some((e) => e.nome === evento.alvo))) return { estado: "entidade_nao_encontrada", evento };
    const correspondentes = this.comportamentos.filter((c) => c.parametros?.evento === evento.semantica && c.parametros?.fonte === evento.fonte && c.parametros?.alvo === evento.alvo);
    let acoesExecutadas = 0;
    for (const comportamento of correspondentes) {
      for (const acao of comportamento.filhos ?? []) {
        if (acao.semantica === "dados.valor.diminuir") {
          const entidade = this.estadoEntidades.find((e) => e.nome === String(acao.parametros?.entidade ?? ""));
          const propriedade = String(acao.parametros?.propriedade ?? "");
          if (!entidade) return { estado: "entidade_nao_encontrada", evento, acoesExecutadas };
          if (!entidade.propriedades || entidade.propriedades[propriedade] === undefined) return { estado: "propriedade_nao_encontrada", evento, acoesExecutadas, detalhe: propriedade };
        }
        const resultado = this.executar(acao);
        if (resultado.estado === "executado") acoesExecutadas += 1;
      }
    }
    return { estado: "executado", evento, acoesExecutadas };
  }

  entidades(): EntidadeMemoria[] {
    return this.estadoEntidades.map((entidade) => ({ ...entidade, ...(entidade.posicao ? { posicao: { ...entidade.posicao } } : {}), ...(entidade.propriedades ? { propriedades: { ...entidade.propriedades } } : {}) }));
  }
}
