import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import type { ResultadoExecucao, RuntimeGoodle } from "../ContratoRuntimeGoodle";

export type EntidadeMemoria = {
  nome: string;
  tipo: string;
  posicao?: { x: number; y: number };
  propriedades?: Record<string, number>;
};
export type EventoRuntimeGoodle = { semantica: string; fonte?: string; alvo?: string; codigo?: string; botao?: string };
export type EstadoEventoGoodle = "executado" | "evento_desconhecido" | "entidade_nao_encontrada" | "propriedade_nao_encontrada" | "condicao_nao_suportada";
export type ResultadoEventoGoodle = { estado: EstadoEventoGoodle; evento: EventoRuntimeGoodle; acoesExecutadas?: number; detalhe?: string };

export class RuntimeMemoria implements RuntimeGoodle {
  private readonly estadoEntidades: EntidadeMemoria[] = [];
  private readonly comportamentos: GoodleIRNode[] = [];

  suporta(semantica: string): boolean {
    return ["entidade.criar", "espaco.posicao", "espaco.movimento", "dados.valor.definir", "dados.valor.diminuir", "dados.valor.aumentar", "comportamento.reacao.quando", "logica.condicao.se"].includes(semantica);
  }

  executar(no: GoodleIRNode): ResultadoExecucao {
    if (!this.suporta(no.semantica)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };

    if (no.semantica === "entidade.criar") {
      const nome = String(no.parametros?.nome ?? ""); const tipo = String(no.parametros?.tipo ?? "entidade");
      this.estadoEntidades.push({ nome, tipo });
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { nome, tipo } };
    }
    if (no.semantica === "comportamento.reacao.quando") return this.registrar(no);
    if (no.semantica === "logica.condicao.se") return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: this.avaliarCondicao(no) } };

    const nome = String(no.parametros?.nome ?? no.parametros?.entidade ?? "");
    const entidade = this.estadoEntidades.find((item) => item.nome === nome);
    if (!entidade) return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "entidade_nao_encontrada", nome } };

    if (no.semantica === "dados.valor.definir") {
      const propriedade = String(no.parametros?.propriedade ?? ""); const valor = Number(no.parametros?.valor);
      entidade.propriedades ??= {}; entidade.propriedades[propriedade] = valor;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, propriedade, valor } };
    }
    if (no.semantica === "dados.valor.aumentar") {
      const propriedade = String(no.parametros?.propriedade ?? ""); const valor = Number(no.parametros?.valor);
      if (!entidade.propriedades || entidade.propriedades[propriedade] === undefined) return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "propriedade_nao_encontrada", nome, propriedade } };
      entidade.propriedades[propriedade] += valor;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, propriedade, valor: entidade.propriedades[propriedade] } };
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

  private avaliarCondicao(no: GoodleIRNode): boolean {
    const nome = String(no.parametros?.entidade ?? "");
    const propriedade = String(no.parametros?.propriedade ?? "");
    const entidade = this.estadoEntidades.find((e) => e.nome === nome);
    if (!entidade?.propriedades || entidade.propriedades[propriedade] === undefined) return false;
    const atual = entidade.propriedades[propriedade];
    const valor = Number(no.parametros?.valor);
    switch (String(no.parametros?.operador)) {
      case "maior_que": return atual > valor;
      case "menor_que": return atual < valor;
      case "igual": return atual === valor;
      default: return false;
    }
  }

  emitir(evento: EventoRuntimeGoodle): ResultadoEventoGoodle {
    const eventosSuportados = ["evento.toque", "evento.iniciar", "evento.atualizar", "evento.tecla.pressionar", "evento.tecla.soltar", "evento.clique"];
    if (!eventosSuportados.includes(evento.semantica)) return { estado: "evento_desconhecido", evento };
    if (evento.semantica === "evento.toque" && (!this.estadoEntidades.some((e) => e.nome === evento.fonte) || (evento.alvo && !this.estadoEntidades.some((e) => e.nome === evento.alvo)))) {
      return { estado: "entidade_nao_encontrada", evento };
    }

    const correspondentes = this.comportamentos.filter((c) => {
      if (c.parametros?.evento !== evento.semantica) return false;
      if (evento.semantica === "evento.toque") return c.parametros?.fonte === evento.fonte && c.parametros?.alvo === evento.alvo;
      if (evento.semantica === "evento.clique") return c.parametros?.alvo === evento.alvo;
      if (evento.semantica === "evento.tecla.pressionar" || evento.semantica === "evento.tecla.soltar") return c.parametros?.codigo === evento.codigo;
      return true;
    });
    let acoesExecutadas = 0;
    for (const comportamento of correspondentes) {
      for (const acao of comportamento.filhos ?? []) {
        if (acao.semantica === "dados.valor.diminuir" || acao.semantica === "dados.valor.aumentar") {
          const entidade = this.estadoEntidades.find((e) => e.nome === String(acao.parametros?.entidade ?? ""));
          const propriedade = String(acao.parametros?.propriedade ?? "");
          if (!entidade) return { estado: "entidade_nao_encontrada", evento, acoesExecutadas };
          if (!entidade.propriedades || entidade.propriedades[propriedade] === undefined) return { estado: "propriedade_nao_encontrada", evento, acoesExecutadas, detalhe: propriedade };
        }
        if (acao.semantica === "logica.condicao.se") {
          const nome = String(acao.parametros?.entidade ?? "");
          const propriedade = String(acao.parametros?.propriedade ?? "");
          const entidade = this.estadoEntidades.find((e) => e.nome === nome);
          if (!entidade) return { estado: "entidade_nao_encontrada", evento, acoesExecutadas };
          if (!entidade.propriedades || entidade.propriedades[propriedade] === undefined) return { estado: "propriedade_nao_encontrada", evento, acoesExecutadas, detalhe: propriedade };
          if (!["maior_que", "menor_que", "igual"].includes(String(acao.parametros?.operador))) return { estado: "condicao_nao_suportada", evento, acoesExecutadas, detalhe: String(acao.parametros?.operador) };
          if (!this.avaliarCondicao(acao)) continue;
          for (const neta of acao.filhos ?? []) {
            const resultado = this.executar(neta);
            if (resultado.estado === "executado") acoesExecutadas += 1;
          }
          continue;
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
