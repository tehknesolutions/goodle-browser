import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import type { ResultadoExecucao, RuntimeGoodle } from "../ContratoRuntimeGoodle";

export type CenaMemoria = { nome: string };\n\nexport type GeometriaMemoria = { tipo: "ponto" | "circulo" | "retangulo"; raio?: number; largura?: number; altura?: number };\n\nexport type EntidadeMemoria = {
  nome: string;
  tipo: string;
  posicao?: { x: number; y: number };\n  rotacao?: number;\n  escala?: { x: number; y: number };\n  geometria?: GeometriaMemoria;\n  fisica?: { vx: number; vy: number; ax: number; ay: number; gx: number; gy: number; massa: number; atrito: number; restitucao: number; bloqueado: boolean };
  propriedades?: Record<string, number>;
};
export type EventoRuntimeGoodle = { semantica: string; fonte?: string; alvo?: string; codigo?: string; botao?: string; temporizadorId?: string; duracaoMs?: number };
export type EstadoEventoGoodle = "executado" | "evento_desconhecido" | "entidade_nao_encontrada" | "propriedade_nao_encontrada" | "condicao_nao_suportada" | "cena_nao_encontrada";
export type ResultadoEventoGoodle = { estado: EstadoEventoGoodle; evento: EventoRuntimeGoodle; acoesExecutadas?: number; detalhe?: string };

export class RuntimeMemoria implements RuntimeGoodle {
  private readonly estadoEntidades: EntidadeMemoria[] = [];
  private readonly comportamentos: GoodleIRNode[] = [];\n  private readonly cenas: CenaMemoria[] = [];\n  private cenaAtual: string | undefined;\n  private regrasFisicas: { limites?: { xMin: number; xMax: number; yMin: number; yMax: number }; superficieY?: number } = {};

  suporta(semantica: string): boolean {
    return ["entidade.criar", "entidade.ativar", "entidade.desativar", "entidade.spawn", "entidade.despawn", "estrutura.cena", "cena.transicao", "espaco.posicao", "espaco.movimento", "espaco.rotacao", "espaco.escala", "geometria.ponto", "geometria.circulo", "geometria.retangulo", "fisica.velocidade", "fisica.aceleracao", "fisica.gravidade", "fisica.massa", "fisica.impulso", "fisica.atualizar", "fisica.limite", "fisica.superficie", "fisica.atrito", "fisica.restituicao", "fisica.bloqueio", "fisica.aplicar_regras", "dados.valor.definir", "dados.valor.diminuir", "dados.valor.aumentar", "comportamento.reacao.quando", "logica.condicao.se"].includes(semantica);
  }

  executar(no: GoodleIRNode): ResultadoExecucao {
    if (!this.suporta(no.semantica)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };

    if (["entidade.ativar", "entidade.desativar", "entidade.spawn", "entidade.despawn"].includes(no.semantica)) {
      const nome = String(no.parametros?.nome ?? "");
      const indice = this.estadoEntidades.findIndex((item) => item.nome === nome);
      if (no.semantica === "entidade.spawn") {
        if (indice >= 0) { this.estadoEntidades[indice].ativo = true; return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, existente: true, nome } }; }
        this.estadoEntidades.push({ nome, tipo: "entidade", ativo: true });
        return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, criado: true, nome } };
      }
      if (indice < 0) return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "entidade_nao_encontrada", nome } };
      if (no.semantica === "entidade.despawn") {
        this.estadoEntidades.splice(indice, 1);
        return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, removido: true, nome } };
      }
      this.estadoEntidades[indice].ativo = no.semantica === "entidade.ativar";
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, ativo: this.estadoEntidades[indice].ativo, nome } };
    }

    if (["fisica.velocidade", "fisica.aceleracao", "fisica.gravidade", "fisica.massa", "fisica.impulso"].includes(no.semantica)) {
      const nome = String(no.parametros?.nome ?? "");
      const entidade = this.estadoEntidades.find((item) => item.nome === nome);
      if (!entidade) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "entidade_nao_encontrada", nome } };
      if (!entidade.fisica) entidade.fisica = { vx: 0, vy: 0, ax: 0, ay: 0, gx: 0, gy: 0, massa: 1, atrito: 0, restitucao: 0, bloqueado: false };
      if (no.semantica === "fisica.massa") {
        const massa = Number(no.parametros?.valor);
        if (!(massa > 0)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "massa_invalida", massa } };
        entidade.fisica.massa = massa;
      } else if (no.semantica === "fisica.velocidade") {
        entidade.fisica.vx = Number(no.parametros?.x ?? 0); entidade.fisica.vy = Number(no.parametros?.y ?? 0);
      } else if (no.semantica === "fisica.aceleracao") {
        entidade.fisica.ax = Number(no.parametros?.x ?? 0); entidade.fisica.ay = Number(no.parametros?.y ?? 0);
      } else if (no.semantica === "fisica.gravidade") {
        entidade.fisica.gx = Number(no.parametros?.x ?? 0); entidade.fisica.gy = Number(no.parametros?.y ?? 0);
      } else {
        entidade.fisica.vx += Number(no.parametros?.x ?? 0) / entidade.fisica.massa;
        entidade.fisica.vy += Number(no.parametros?.y ?? 0) / entidade.fisica.massa;
      }
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, fisica: { ...entidade.fisica } } };
    }

    if (no.semantica === "fisica.limite") {
      this.regrasFisicas.limites = { xMin: Number(no.parametros?.xMin), xMax: Number(no.parametros?.xMax), yMin: Number(no.parametros?.yMin), yMax: Number(no.parametros?.yMax) };
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { regras: this.regrasFisicas } };
    }
    if (no.semantica === "fisica.superficie") {
      this.regrasFisicas.superficieY = Number(no.parametros?.y);
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { regras: this.regrasFisicas } };
    }
    if (no.semantica === "fisica.atrito" || no.semantica === "fisica.restituicao" || no.semantica === "fisica.bloqueio") {
      const nome = String(no.parametros?.nome ?? "");
      const entidade = this.estadoEntidades.find((item) => item.nome === nome);
      if (!entidade) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "entidade_nao_encontrada", nome } };
      if (!entidade.fisica) entidade.fisica = { vx: 0, vy: 0, ax: 0, ay: 0, gx: 0, gy: 0, massa: 1, atrito: 0, restitucao: 0, bloqueado: false };
      if (no.semantica === "fisica.atrito") {
        const valor = Number(no.parametros?.valor);
        if (valor < 0) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "atrito_invalido", atrito: valor } };
        entidade.fisica.atrito = valor;
      } else if (no.semantica === "fisica.restituicao") {
        const valor = Number(no.parametros?.valor);
        if (valor < 0 || valor > 1) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "restituicao_invalida", restitucao: valor } };
        entidade.fisica.restitucao = valor;
      } else entidade.fisica.bloqueado = true;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { fisica: { ...entidade.fisica } } };
    }
    if (no.semantica === "fisica.aplicar_regras") {
      const dt = Number(no.parametros?.dt);
      if (!(dt >= 0)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "dt_invalido" } };
      const l = this.regrasFisicas.limites;
      for (const entidade of this.estadoEntidades) {
        if (!entidade.fisica || !entidade.posicao) continue;
        const ph = entidade.fisica;
        if (ph.bloqueado) { ph.vx = 0; ph.vy = 0; continue; }
        if (ph.atrito > 0) {
          const fator = Math.max(0, 1 - ph.atrito * dt);
          ph.vx *= fator; ph.vy *= fator;
        }
        if (this.regrasFisicas.superficieY !== undefined && entidade.posicao.y < this.regrasFisicas.superficieY) {
          entidade.posicao.y = this.regrasFisicas.superficieY;
          if (ph.vy < 0) ph.vy = -ph.vy * ph.restitucao;
        }
        if (l) {
          if (entidade.posicao.x < l.xMin) { entidade.posicao.x = l.xMin; if (ph.vx < 0) ph.vx = -ph.vx * ph.restitucao; }
          if (entidade.posicao.x > l.xMax) { entidade.posicao.x = l.xMax; if (ph.vx > 0) ph.vx = -ph.vx * ph.restitucao; }
          if (entidade.posicao.y < l.yMin) { entidade.posicao.y = l.yMin; if (ph.vy < 0) ph.vy = -ph.vy * ph.restitucao; }
          if (entidade.posicao.y > l.yMax) { entidade.posicao.y = l.yMax; if (ph.vy > 0) ph.vy = -ph.vy * ph.restitucao; }
        }
      }
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, dt } };
    }

    if (no.semantica === "fisica.atualizar") {
      const dt = Number(no.parametros?.dt);
      if (!(dt >= 0)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "dt_invalido", dt } };
      for (const entidade of this.estadoEntidades) {
        if (!entidade.fisica || !entidade.posicao) continue;
        entidade.fisica.vx += (entidade.fisica.ax + entidade.fisica.gx) * dt;
        entidade.fisica.vy += (entidade.fisica.ay + entidade.fisica.gy) * dt;
        entidade.posicao.x += entidade.fisica.vx * dt;
        entidade.posicao.y += entidade.fisica.vy * dt;
      }
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, dt } };
    }

    if (no.semantica === "geometria.ponto" || no.semantica === "geometria.circulo" || no.semantica === "geometria.retangulo") {
      const nome = String(no.parametros?.nome ?? "");
      const entidade = this.estadoEntidades.find((item) => item.nome === nome);
      if (!entidade) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "entidade_nao_encontrada", nome } };
      if (no.semantica === "geometria.ponto") entidade.geometria = { tipo: "ponto" };
      if (no.semantica === "geometria.circulo") entidade.geometria = { tipo: "circulo", raio: Number(no.parametros?.raio) };
      if (no.semantica === "geometria.retangulo") entidade.geometria = { tipo: "retangulo", largura: Number(no.parametros?.largura), altura: Number(no.parametros?.altura) };
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, geometria: entidade.geometria } };
    }

    if (no.semantica === "estrutura.cena") {\n      const nome = String(no.parametros?.nome ?? "");\n      if (!nome) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };\n      if (!this.cenas.some((cena) => cena.nome === nome)) this.cenas.push({ nome });\n      if (!this.cenaAtual) this.cenaAtual = nome;\n      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { nome, atual: this.cenaAtual === nome } };\n    }\n    if (no.semantica === "cena.transicao") {\n      const destino = String(no.parametros?.destino ?? "");\n      if (!this.cenas.some((cena) => cena.nome === destino)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "cena_nao_encontrada", destino } };\n      const anterior = this.cenaAtual;\n      this.cenaAtual = destino;\n      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, anterior, atual: destino } };\n    }\n\n    if (no.semantica === "entidade.criar") {
      const nome = String(no.parametros?.nome ?? ""); const tipo = String(no.parametros?.tipo ?? "entidade");
      this.estadoEntidades.push({ nome, tipo, ativo: true });
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

    if (no.semantica === "espaco.rotacao" || no.semantica === "espaco.escala") {
      const nome = String(no.parametros?.nome ?? "");
      const entidade = this.estadoEntidades.find((item) => item.nome === nome);
      if (!entidade) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { aplicado: false, motivo: "entidade_nao_encontrada", nome } };
      if (no.semantica === "espaco.rotacao") {
        entidade.rotacao = Number(no.parametros?.graus ?? 0);
        return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, graus: entidade.rotacao } };
      }
      entidade.escala = { x: Number(no.parametros?.x ?? 1), y: Number(no.parametros?.y ?? 1) };
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, nome, escala: entidade.escala } };
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

  private avaliarRelacaoEspacial(no: GoodleIRNode): boolean {
    const sujeitoNome = String(no.parametros?.sujeito ?? "");
    const objetoNome = String(no.parametros?.objeto ?? "");
    const sujeito = this.estadoEntidades.find((e) => e.nome === sujeitoNome);
    const objeto = this.estadoEntidades.find((e) => e.nome === objetoNome);
    if (!sujeito?.posicao || !objeto?.posicao) return false;
    const dx = sujeito.posicao.x - objeto.posicao.x;
    const dy = sujeito.posicao.y - objeto.posicao.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    const gs = sujeito.geometria;
    const go = objeto.geometria;
    if (String(no.parametros?.relacao) === "espaco.colisao" || String(no.parametros?.relacao) === "espaco.sobreposicao") {
      if (gs?.tipo === "circulo" && go?.tipo === "circulo") return distancia <= Number(gs.raio ?? 0) + Number(go.raio ?? 0);
      if (gs?.tipo === "retangulo" && go?.tipo === "retangulo") {
        return Math.abs(dx) <= (Number(gs.largura ?? 0) + Number(go.largura ?? 0)) / 2 && Math.abs(dy) <= (Number(gs.altura ?? 0) + Number(go.altura ?? 0)) / 2;
      }
    }
    if (String(no.parametros?.relacao) === "espaco.dentro" && go?.tipo === "circulo") return distancia <= Number(go.raio ?? 0);
    if (String(no.parametros?.relacao) === "espaco.dentro" && go?.tipo === "retangulo") return Math.abs(dx) <= Number(go.largura ?? 0) / 2 && Math.abs(dy) <= Number(go.altura ?? 0) / 2;
    switch (String(no.parametros?.relacao)) {
      case "espaco.colisao":
      case "espaco.sobreposicao": return distancia <= 1;
      case "espaco.fora": return distancia > 1;
      case "espaco.perto": return distancia <= 5;
      default: return false;
    }
  }

  distanciaEntre(sujeitoNome: string, objetoNome: string): number | undefined {
    const sujeito = this.estadoEntidades.find((e) => e.nome === sujeitoNome);
    const objeto = this.estadoEntidades.find((e) => e.nome === objetoNome);
    if (!sujeito?.posicao || !objeto?.posicao) return undefined;
    const dx = sujeito.posicao.x - objeto.posicao.x;
    const dy = sujeito.posicao.y - objeto.posicao.y;
    return Math.sqrt(dx * dx + dy * dy);
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
    const eventosSuportados = ["evento.toque", "evento.iniciar", "evento.atualizar", "evento.tecla.pressionar", "evento.tecla.soltar", "evento.clique", "evento.temporizador.disparar", "evento.tempo.esperar", "evento.tempo.intervalo"];
    if (!eventosSuportados.includes(evento.semantica)) return { estado: "evento_desconhecido", evento };
    if (evento.semantica === "evento.toque" && (!this.estadoEntidades.some((e) => e.nome === evento.fonte) || (evento.alvo && !this.estadoEntidades.some((e) => e.nome === evento.alvo)))) {
      return { estado: "entidade_nao_encontrada", evento };
    }

    const correspondentes = this.comportamentos.filter((c) => {
      if (c.parametros?.evento !== evento.semantica) return false;
      if (evento.semantica === "evento.toque") return c.parametros?.fonte === evento.fonte && c.parametros?.alvo === evento.alvo;
      if (evento.semantica === "evento.clique") return c.parametros?.alvo === evento.alvo;
      if (evento.semantica === "evento.tecla.pressionar" || evento.semantica === "evento.tecla.soltar") return c.parametros?.codigo === evento.codigo;
      if (evento.semantica === "evento.temporizador.disparar" || evento.semantica === "evento.tempo.esperar" || evento.semantica === "evento.tempo.intervalo") return Number(c.parametros?.duracaoMs) === Number(evento.duracaoMs) && (!c.parametros?.temporizadorId || c.parametros?.temporizadorId === evento.temporizadorId);
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
          if (acao.parametros?.relacao) {
            if (!this.avaliarRelacaoEspacial(acao)) continue;
          } else {
            const nome = String(acao.parametros?.entidade ?? "");
            const propriedade = String(acao.parametros?.propriedade ?? "");
            const entidade = this.estadoEntidades.find((e) => e.nome === nome);
            if (!entidade) return { estado: "entidade_nao_encontrada", evento, acoesExecutadas };
            if (!entidade.propriedades || entidade.propriedades[propriedade] === undefined) return { estado: "propriedade_nao_encontrada", evento, acoesExecutadas, detalhe: propriedade };
            if (!["maior_que", "menor_que", "igual"].includes(String(acao.parametros?.operador))) return { estado: "condicao_nao_suportada", evento, acoesExecutadas, detalhe: String(acao.parametros?.operador) };
            if (!this.avaliarCondicao(acao)) continue;
          }
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

  cenasRegistradas(): CenaMemoria[] {\n    return this.cenas.map((cena) => ({ ...cena }));\n  }\n\n  cenaAtualNome(): string | undefined {\n    return this.cenaAtual;\n  }\n\n  entidades(): EntidadeMemoria[] {
    return this.estadoEntidades.map((entidade) => ({ ...entidade, ...(entidade.posicao ? { posicao: { ...entidade.posicao } } : {}), ...(entidade.propriedades ? { propriedades: { ...entidade.propriedades } } : {}) }));
  }
}
