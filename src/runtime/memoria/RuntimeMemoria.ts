import type { GoodleIRNode } from "../../nucleo/ir/GoodleIR";
import type { ResultadoExecucao, RuntimeGoodle } from "../ContratoRuntimeGoodle";

export type CenaMemoria = { nome: string };\n\nexport type GeometriaMemoria = { tipo: "ponto" | "circulo" | "retangulo"; raio?: number; largura?: number; altura?: number };\n\nexport type EntidadeMemoria = {
  nome: string;
  tipo: string;
  posicao?: { x: number; y: number };\n  rotacao?: number;\n  escala?: { x: number; y: number };\n  geometria?: GeometriaMemoria;\n  fisica?: { vx: number; vy: number; ax: number; ay: number; gx: number; gy: number; massa: number; atrito: number; restitucao: number; bloqueado: boolean; dormindo: boolean };
  propriedades?: Record<string, number>;
};
export type EventoRuntimeGoodle = { semantica: string; fonte?: string; alvo?: string; codigo?: string; botao?: string; temporizadorId?: string; duracaoMs?: number };
export type EstadoEventoGoodle = "executado" | "evento_desconhecido" | "entidade_nao_encontrada" | "propriedade_nao_encontrada" | "condicao_nao_suportada" | "cena_nao_encontrada";
export type ResultadoEventoGoodle = { estado: EstadoEventoGoodle; evento: EventoRuntimeGoodle; acoesExecutadas?: number; detalhe?: string };

export class RuntimeMemoria implements RuntimeGoodle {
  private readonly estadoEntidades: EntidadeMemoria[] = [];
  private readonly comportamentos: GoodleIRNode[] = [];\n  private readonly cenas: CenaMemoria[] = [];\n  private cenaAtual: string | undefined;\n  private regrasFisicas: { limites?: { xMin: number; xMax: number; yMin: number; yMax: number }; superficieY?: number; iteracoes: number; ccd: boolean; broadphase: boolean } = { iteracoes: 4, ccd: false, broadphase: false };\n  private contatosPersistentesCache = new Map<string, { impulsoNormal: number; normal: { x: number; y: number }; penetracao: number }>();\n  private repousoFisico = { velocidade: 0.01, forca: 0.01, steps: 3 };\n  private contadorRepouso = new Map<string, number>();\n  private ilhasFisicas: Array<{ id: string; membros: string[] }> = [];
  private broadphaseGrade = new Map<string, Set<string>>();
  private broadphaseProxyCells = new Map<string, Set<string>>();
  private broadphaseProxyAabbs = new Map<string, string>();
  private broadphaseParesCache = new Map<string, { assinatura: string; pares: Array<{ sujeito: string; objeto: string }> }>();
  private broadphaseTamanhoCelula = 4;

  suporta(semantica: string): boolean {
    return ["entidade.criar", "entidade.ativar", "entidade.desativar", "entidade.spawn", "entidade.despawn", "estrutura.cena", "cena.transicao", "espaco.posicao", "espaco.movimento", "espaco.rotacao", "espaco.escala", "geometria.ponto", "geometria.circulo", "geometria.retangulo", "fisica.velocidade", "fisica.aceleracao", "fisica.gravidade", "fisica.massa", "fisica.impulso", "fisica.atualizar", "fisica.limite", "fisica.superficie", "fisica.atrito", "fisica.restituicao", "fisica.bloqueio", "fisica.aplicar_regras", "fisica.evento_acordar", "fisica.ilhas", "fisica.ativar_ilha", "fisica.estado_ilhas", "fisica.sleep", "fisica.acordar", "fisica.estado_repouso", "fisica.limiar_repouso", "fisica.colisao_continua", "fisica.contatos_persistentes", "fisica.resolver_contatos_persistentes", "fisica.contatos", "fisica.resolver_contatos", "fisica.iteracoes", "fisica.simular", "fisica.broadphase", "fisica.particao_espacial", "fisica.candidatos_colisao", "fisica.broadphase_ativar", "fisica.broadphase_desativar", "fisica.pares_colisao", "dados.valor.definir", "dados.valor.diminuir", "dados.valor.aumentar", "comportamento.reacao.quando", "logica.condicao.se"].includes(semantica);
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
      if (!entidade.fisica) entidade.fisica = { vx: 0, vy: 0, ax: 0, ay: 0, gx: 0, gy: 0, massa: 1, atrito: 0, restitucao: 0, bloqueado: false, dormindo: false };
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
    if (no.semantica === "fisica.evento_acordar") {
      const acordadas: string[] = [];
      for (const entidade of this.estadoEntidades) if (entidade.fisica && !entidade.fisica.bloqueado) acordadas.push(...this.acordarIlhaDo(entidade.nome));
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { acordadas: [...new Set(acordadas)].sort((a,b)=>a.localeCompare(b)) } };
    }
    if (no.semantica === "fisica.ilhas" || no.semantica === "fisica.estado_ilhas") {
      const ilhas=this.recalcularIlhasFisicas();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { ilhas } };
    }
    if (no.semantica === "fisica.ativar_ilha") {
      const ilhas=this.recalcularIlhasFisicas();
      const acordadas:string[]=[];
      for(const ilha of ilhas) acordadas.push(...this.acordarIlhaDo(ilha.membros[0]));
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { ilhas: [...new Set(acordadas)].sort((a,b)=>a.localeCompare(b)) } };
    }

    if (no.semantica === "fisica.broadphase" || no.semantica === "fisica.particao_espacial" || no.semantica === "fisica.candidatos_colisao") {
      const candidatos = this.candidatosColisao();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { candidatos, celula: 4, deterministico: true } };
    }

    if (no.semantica === "fisica.broadphase_pares_cache" || no.semantica === "fisica.broadphase_pares_atualizar") {
      const pares=this.atualizarCacheParesBroadphase();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { pares, cacheHit: this.broadphaseParesCache.get("global")?.assinatura === this.assinaturaBroadphasePares() } };
    }
    if (no.semantica === "fisica.broadphase_pares_estado") {
      const cache=this.broadphaseParesCache.get("global");
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { presente: !!cache, assinatura: cache?.assinatura ?? null, pares: cache?.pares ?? [] } };
    }

    if (no.semantica === "fisica.broadphase_atualizar") {
      this.garantirBroadphaseAtualizado();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { atualizado: true, celulas: this.broadphaseGrade.size } };
    }
    if (no.semantica === "fisica.broadphase_reconstruir") {
      this.reconstruirBroadphase();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { reconstruido: true, celulas: this.broadphaseGrade.size } };
    }
    if (no.semantica === "fisica.broadphase_estado") {
      this.garantirBroadphaseAtualizado();
      const celulas=[...this.broadphaseGrade.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([celula,membros])=>({celula,membros:[...membros].sort((a,b)=>a.localeCompare(b))}));
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { celulas, proxies: [...this.broadphaseProxyCells.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([nome,cells])=>({nome,cells:[...cells].sort((a,b)=>a.localeCompare(b))})) } };
    }

    if (no.semantica === "fisica.broadphase_ativar") {
      this.regrasFisicas.broadphase = true;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { broadphase: true } };
    }
    if (no.semantica === "fisica.broadphase_desativar") {
      this.regrasFisicas.broadphase = false;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { broadphase: false } };
    }
    if (no.semantica === "fisica.pares_colisao") {
      const candidatos = this.regrasFisicas.broadphase ? this.candidatosColisao() : this.estadoEntidades.flatMap((a, i) => this.estadoEntidades.slice(i + 1).map(b => ({ sujeito: a.nome, objeto: b.nome })));
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { candidatos, estrategia: this.regrasFisicas.broadphase ? "broadphase" : "all-pairs" } };
    }

    if (no.semantica === "fisica.limiar_repouso") {
      const valor = Number(no.parametros?.valor);
      if (!(valor > 0)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "limiar_invalido", valor } };
      this.repousoFisico.velocidade = valor;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { ...this.repousoFisico } };
    }
    if (no.semantica === "fisica.sleep" || no.semantica === "fisica.acordar") {
      for (const entidade of this.estadoEntidades) {
        if (!entidade.fisica) continue;
        entidade.fisica.dormindo = no.semantica === "fisica.sleep";
        if (!entidade.fisica.dormindo) this.contadorRepouso.set(entidade.nome, 0);
      }
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true } };
    }
    if (no.semantica === "fisica.estado_repouso") {
      const estados = this.estadoEntidades.map((e) => ({ nome: e.nome, dormindo: e.fisica?.dormindo ?? false, contador: this.contadorRepouso.get(e.nome) ?? 0 }));
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { estados } };
    }

    if (no.semantica === "fisica.colisao_continua") {
      this.regrasFisicas.ccd = true;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { ccd: true } };
    }
    if (no.semantica === "fisica.contatos_persistentes") {
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { contatos: this.contatosPersistentes(), cache: [...this.contatosPersistentesCache.entries()] } };
    }
    if (no.semantica === "fisica.resolver_contatos_persistentes") {
      const resolvidos = this.resolverContatosPersistentes();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { resolvidos, cache: [...this.contatosPersistentesCache.entries()] } };
    }

    if (no.semantica === "fisica.contatos") {
      const contatos = this.contatosFisicos();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { contatos } };
    }
    if (no.semantica === "fisica.resolver_contatos") {
      const contatos = this.contatosFisicos();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { contatos, resolvidos: contatos.length } };
    }

    if (no.semantica === "fisica.iteracoes") {
      const valor = Math.floor(Number(no.parametros?.valor));
      if (!Number.isFinite(valor) || valor < 1 || valor > 32) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "iteracoes_invalidas", valor } };
      this.regrasFisicas.iteracoes = valor;
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { iteracoes: valor } };
    }

    if (no.semantica === "fisica.simular" && this.regrasFisicas.ccd) {
      const dt = Number(no.parametros?.dt);
      const ccd = this.colisaoContinua(dt);
      const base = this.executar({ id: `${no.id}:base`, semantica: "fisica.atualizar", familia: "mundo", parametros: { dt } });
      const contatos = this.contatosFisicos();
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, dt, ccd, contatos, base } };
    }

    if (no.semantica === "fisica.simular") {
      const dt = Number(no.parametros?.dt);
      if (!(dt >= 0)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "dt_invalido", dt } };
      const integracao = this.executar({ id: `${no.id}:integrar`, semantica: "fisica.atualizar", familia: "mundo", parametros: { dt } });
      const regras = this.executar({ id: `${no.id}:regras`, semantica: "fisica.aplicar_regras", familia: "mundo", parametros: { dt } });
      const colisoes: unknown[] = [];
      for (let i = 0; i < this.regrasFisicas.iteracoes; i++) {
        const resultado = this.resolverColisoes(this.regrasFisicas.broadphase ? this.candidatosColisao() : undefined);
        colisoes.push(...resultado.filter((item) => item.colidiu));
        if (resultado.every((item) => !item.colidiu)) break;
      }
      const regrasFinais = this.executar({ id: `${no.id}:regras-finais`, semantica: "fisica.aplicar_regras", familia: "mundo", parametros: { dt: 0 } });
      for (const entidade of this.estadoEntidades) {
        if (!entidade.fisica) continue;
        const velocidade = Math.sqrt(entidade.fisica.vx ** 2 + entidade.fisica.vy ** 2);
        const forca = Math.sqrt((entidade.fisica.ax + entidade.fisica.gx) ** 2 + (entidade.fisica.ay + entidade.fisica.gy) ** 2);
        if (velocidade <= this.repousoFisico.velocidade && forca <= this.repousoFisico.forca) {
          const count = (this.contadorRepouso.get(entidade.nome) ?? 0) + 1;
          this.contadorRepouso.set(entidade.nome, count);
          if (count >= this.repousoFisico.steps) entidade.fisica.dormindo = true;
        } else {
          this.contadorRepouso.set(entidade.nome, 0);
          entidade.fisica.dormindo = false;
        }
      }
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, dt, iteracoes: this.regrasFisicas.iteracoes, integracao, regras, colisoes, regrasFinais } };
    }

    if (no.semantica === "fisica.colisao_resolver") {
      const colisoes = this.resolverColisoes(this.regrasFisicas.broadphase ? this.candidatosColisao() : undefined);
      return { estado: "executado", idNo: no.id, semantica: no.semantica, valor: { aplicado: true, colisoes, estrategia: this.regrasFisicas.broadphase ? "broadphase" : "all-pairs" } };
    }

    if (no.semantica === "fisica.aplicar_regras") {
      const dt = Number(no.parametros?.dt);
      if (!(dt >= 0)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica, valor: { motivo: "dt_invalido" } };
      const l = this.regrasFisicas.limites;
      for (const entidade of this.estadoEntidades) {
        if (!entidade.fisica || !entidade.posicao || entidade.fisica.dormindo) continue;
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
        if (!entidade.fisica || !entidade.posicao || entidade.fisica.dormindo) continue;
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

  private celulasAabb(aabb: { xMin: number; xMax: number; yMin: number; yMax: number }): string[] {
    const minX = Math.floor(aabb.xMin / this.broadphaseTamanhoCelula), maxX = Math.floor(aabb.xMax / this.broadphaseTamanhoCelula);
    const minY = Math.floor(aabb.yMin / this.broadphaseTamanhoCelula), maxY = Math.floor(aabb.yMax / this.broadphaseTamanhoCelula);
    const cells: string[] = [];
    for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) cells.push(x + "," + y);
    return cells.sort((a,b)=>a.localeCompare(b));
  }

  private atualizarProxyBroadphase(nome: string): void {
    const anterior = this.broadphaseProxyCells.get(nome) ?? new Set<string>();
    for (const cell of anterior) {
      const membros = this.broadphaseGrade.get(cell);
      membros?.delete(nome);
      if (membros && membros.size === 0) this.broadphaseGrade.delete(cell);
    }
    const entidade = this.estadoEntidades.find(e=>e.nome===nome);
    const aabb = entidade ? this.aabbEntidade(entidade) : undefined;
    if (!aabb) { this.broadphaseProxyCells.delete(nome); this.broadphaseProxyAabbs.delete(nome); return; }
    const assinatura = [aabb.xMin,aabb.xMax,aabb.yMin,aabb.yMax].join("|");
    if (this.broadphaseProxyAabbs.get(nome) === assinatura && this.broadphaseProxyCells.has(nome)) return;
    const novas = new Set(this.celulasAabb(aabb));
    this.broadphaseProxyCells.set(nome, novas);
    this.broadphaseProxyAabbs.set(nome, assinatura);
    this.broadphaseParesCache.clear();
    for (const cell of novas) {
      const membros=this.broadphaseGrade.get(cell) ?? new Set<string>();
      membros.add(nome); this.broadphaseGrade.set(cell,membros);
    }
  }

  private reconstruirBroadphase(): void {
    this.broadphaseGrade.clear(); this.broadphaseProxyCells.clear(); this.broadphaseProxyAabbs.clear(); this.broadphaseParesCache.clear();
    for (const entidade of [...this.estadoEntidades].sort((a,b)=>a.nome.localeCompare(b.nome))) this.atualizarProxyBroadphase(entidade.nome);
  }

  private garantirBroadphaseAtualizado(): void {
    const nomes = new Set(this.estadoEntidades.map(e=>e.nome));
    for (const nome of [...this.broadphaseProxyCells.keys()]) if (!nomes.has(nome)) this.atualizarProxyBroadphase(nome);
    for (const entidade of [...this.estadoEntidades].sort((a,b)=>a.nome.localeCompare(b.nome))) this.atualizarProxyBroadphase(entidade.nome);
  }

  aabbEntidade(entidade: EntidadeMemoria): { xMin: number; xMax: number; yMin: number; yMax: number } | undefined {
    if (!entidade.posicao || !entidade.geometria) return undefined;
    const g = entidade.geometria;
    if (g.tipo === "circulo") {
      const r = Math.max(0, Number(g.raio ?? 0));
      return { xMin: entidade.posicao.x - r, xMax: entidade.posicao.x + r, yMin: entidade.posicao.y - r, yMax: entidade.posicao.y + r };
    }
    if (g.tipo === "retangulo") {
      const hx = Math.max(0, Number(g.largura ?? 0)) / 2;
      const hy = Math.max(0, Number(g.altura ?? 0)) / 2;
      return { xMin: entidade.posicao.x - hx, xMax: entidade.posicao.x + hx, yMin: entidade.posicao.y - hy, yMax: entidade.posicao.y + hy };
    }
    return { xMin: entidade.posicao.x, xMax: entidade.posicao.x, yMin: entidade.posicao.y, yMax: entidade.posicao.y };
  }

  private assinaturaBroadphasePares(): string {
    return [...this.broadphaseProxyAabbs.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([nome,aabb])=>nome+"="+aabb).join(";");
  }

  atualizarCacheParesBroadphase(): Array<{ sujeito: string; objeto: string }> {
    this.garantirBroadphaseAtualizado();
    const assinatura=this.assinaturaBroadphasePares();
    const existente=this.broadphaseParesCache.get("global");
    if (existente?.assinatura===assinatura) return existente.pares;
    const pares=this.candidatosColisaoSemCache();
    this.broadphaseParesCache.set("global",{assinatura,pares});
    return pares;
  }

  private candidatosColisaoSemCache(): Array<{ sujeito: string; objeto: string }> {
    const nomes = new Map(this.estadoEntidades.map(e=>[e.nome,e]));
    const pares = new Set<string>();
    for (const membros of this.broadphaseGrade.values()) {
      const ordenada=[...membros].sort((a,b)=>a.localeCompare(b));
      for(let i=0;i<ordenada.length;i++) for(let j=i+1;j<ordenada.length;j++){
        const a=nomes.get(ordenada[i]), b=nomes.get(ordenada[j]);
        if(!a||!b) continue;
        const aa=this.aabbEntidade(a), bb=this.aabbEntidade(b);
        if(!aa||!bb) continue;
        if(aa.xMin<=bb.xMax&&aa.xMax>=bb.xMin&&aa.yMin<=bb.yMax&&aa.yMax>=bb.yMin) pares.add(a.nome+"/"+b.nome);
      }
    }
    return [...pares].map(chave=>{const [sujeito,objeto]=chave.split("/");return {sujeito,objeto};}).sort((a,b)=>a.sujeito.localeCompare(b.sujeito)||a.objeto.localeCompare(b.objeto));
  }

  candidatosColisao(): Array<{ sujeito: string; objeto: string }> {
    this.garantirBroadphaseAtualizado();
    const cache = this.broadphaseParesCache.get("global");
    if (cache?.assinatura === this.assinaturaBroadphasePares()) return cache.pares;
    const nomes = new Map(this.estadoEntidades.map(e=>[e.nome,e]));
    const pares = new Set<string>();
    for (const membros of this.broadphaseGrade.values()) {
      const ordenada=[...membros].sort((a,b)=>a.localeCompare(b));
      for(let i=0;i<ordenada.length;i++) for(let j=i+1;j<ordenada.length;j++){
        const a=nomes.get(ordenada[i]), b=nomes.get(ordenada[j]);
        if(!a||!b) continue;
        const aa=this.aabbEntidade(a), bb=this.aabbEntidade(b);
        if(!aa||!bb) continue;
        if(aa.xMin<=bb.xMax&&aa.xMax>=bb.xMin&&aa.yMin<=bb.yMax&&aa.yMax>=bb.yMin) pares.add(a.nome+"/"+b.nome);
      }
    }
    const resultado=[...pares].map(chave=>{const [sujeito,objeto]=chave.split("/");return {sujeito,objeto};}).sort((a,b)=>a.sujeito.localeCompare(b.sujeito)||a.objeto.localeCompare(b.objeto));
    this.broadphaseParesCache.set("global",{assinatura:this.assinaturaBroadphasePares(),pares:resultado});
    return resultado;
  }

  recalcularIlhasFisicas(): Array<{ id: string; membros: string[] }> {
    const nomes = this.estadoEntidades.map(e=>e.nome).sort((a,b)=>a.localeCompare(b));
    const parent = new Map<string,string>(nomes.map(n=>[n,n]));
    const find=(x:string):string=>{let p=parent.get(x)??x; while(p!==(parent.get(p)??p)){p=parent.get(p)??p;} return p;};
    const union=(a:string,b:string)=>{const pa=find(a),pb=find(b);if(pa!==pb) parent.set(pb,pa);};
    for(const chave of this.contatosPersistentesCache.keys()){const [a,b]=chave.split("/");if(parent.has(a)&&parent.has(b))union(a,b);}
    const grupos=new Map<string,string[]>();
    for(const n of nomes){const root=find(n);const g=grupos.get(root)??[];g.push(n);grupos.set(root,g);}
    this.ilhasFisicas=[...grupos.values()].map(membros=>({id:membros.join("|"),membros:[...membros].sort((a,b)=>a.localeCompare(b))})).sort((a,b)=>a.id.localeCompare(b.id));
    return this.ilhasFisicas;
  }

  acordarIlhaDo(nome:string): string[] {
    this.recalcularIlhasFisicas();
    const ilha=this.ilhasFisicas.find(i=>i.membros.includes(nome));
    if(!ilha) return [];
    for(const membro of ilha.membros){const e=this.estadoEntidades.find(x=>x.nome===membro);if(e?.fisica&&!e.fisica.bloqueado){e.fisica.dormindo=false;this.contadorRepouso.set(membro,0);}}
    return ilha.membros;
  }

  contatosPersistentes(): Array<{ sujeito: string; objeto: string; normal: { x: number; y: number }; penetracao: number; impulsoNormal: number }> {
    const atuais = this.contatosFisicos();
    const presentes = new Set<string>();
    const saida = atuais.map((contato) => {
      const chave = `${contato.sujeito}/${contato.objeto}`;
      presentes.add(chave);
      const anterior = this.contatosPersistentesCache.get(chave);
      const estado = anterior ?? { impulsoNormal: 0, normal: contato.normal, penetracao: contato.penetracao };
      estado.normal = contato.normal; estado.penetracao = contato.penetracao;
      this.contatosPersistentesCache.set(chave, estado);
      return { sujeito: contato.sujeito, objeto: contato.objeto, normal: contato.normal, penetracao: contato.penetracao, impulsoNormal: estado.impulsoNormal };
    });
    for (const chave of [...this.contatosPersistentesCache.keys()]) if (!presentes.has(chave)) this.contatosPersistentesCache.delete(chave);
    return saida.sort((a,b)=>a.sujeito.localeCompare(b.sujeito)||a.objeto.localeCompare(b.objeto));
  }

  resolverContatosPersistentes(): Array<{ sujeito: string; objeto: string; impulsoNormal: number }> {
    const resolvidos: Array<{ sujeito: string; objeto: string; impulsoNormal: number }> = [];
    for (let iter = 0; iter < this.regrasFisicas.iteracoes; iter++) {
      const contatos = this.contatosPersistentes();
      if (!contatos.length) break;
      let mudou = false;
      for (const contato of contatos) {
        const a=this.estadoEntidades.find(e=>e.nome===contato.sujeito), b=this.estadoEntidades.find(e=>e.nome===contato.objeto);
        if(!a?.fisica||!b?.fisica) continue;
        const invA=a.fisica.bloqueado?0:1/a.fisica.massa, invB=b.fisica.bloqueado?0:1/b.fisica.massa, inv=invA+invB;
        if(!inv) continue;
        const rvx=b.fisica.vx-a.fisica.vx, rvy=b.fisica.vy-a.fisica.vy, vn=rvx*contato.normal.x+rvy*contato.normal.y;
        if(vn>=0) continue;
        const chave=`${contato.sujeito}/${contato.objeto}`, e=Math.min(a.fisica.restitucao,b.fisica.restitucao);
        const delta=-(1+e)*vn/inv, anterior=this.contatosPersistentesCache.get(chave)?.impulsoNormal??0, novo=Math.max(0,anterior+delta), aplicado=novo-anterior;
        if(aplicado<=0) continue;
        const cache=this.contatosPersistentesCache.get(chave); if(cache) cache.impulsoNormal=novo;
        a.fisica.vx-=aplicado*contato.normal.x*invA; a.fisica.vy-=aplicado*contato.normal.y*invA;
        b.fisica.vx+=aplicado*contato.normal.x*invB; b.fisica.vy+=aplicado*contato.normal.y*invB;
        resolvidos.push({sujeito:a.nome,objeto:b.nome,impulsoNormal:novo}); mudou=true;
      }
      if(!mudou) break;
    }
    return resolvidos;
  }

  contatosFisicos(): Array<{ sujeito: string; objeto: string; normal: { x: number; y: number }; penetracao: number; pontos: Array<{ x: number; y: number }>; velocidadeRelativa: { x: number; y: number } }> {
    const contatos: Array<{ sujeito: string; objeto: string; normal: { x: number; y: number }; penetracao: number; pontos: Array<{ x: number; y: number }>; velocidadeRelativa: { x: number; y: number } }> = [];
    const pares = this.resolverColisoes().filter((item) => item.colidiu);
    for (const par of pares) {
      const a = this.estadoEntidades.find((e) => e.nome === par.sujeito);
      const b = this.estadoEntidades.find((e) => e.nome === par.objeto);
      if (!a?.posicao || !b?.posicao) continue;
      contatos.push({
        sujeito: par.sujeito, objeto: par.objeto, normal: par.normal, penetracao: par.penetracao,
        pontos: [{ x: (a.posicao.x + b.posicao.x) / 2, y: (a.posicao.y + b.posicao.y) / 2 }],
        velocidadeRelativa: { x: (b.fisica?.vx ?? 0) - (a.fisica?.vx ?? 0), y: (b.fisica?.vy ?? 0) - (a.fisica?.vy ?? 0) }
      });
    }
    return contatos.sort((a,b) => a.sujeito.localeCompare(b.sujeito) || a.objeto.localeCompare(b.objeto));
  }

  colisaoContinua(dt: number): Array<{ sujeito: string; objeto: string; toi: number; normal: { x: number; y: number } }> {
    const resultados: Array<{ sujeito: string; objeto: string; toi: number; normal: { x: number; y: number } }> = [];
    for (let i = 0; i < this.estadoEntidades.length; i++) for (let j = i + 1; j < this.estadoEntidades.length; j++) {
      const a = this.estadoEntidades[i], b = this.estadoEntidades[j];
      if (!a.posicao || !b.posicao || a.geometria?.tipo !== "circulo" || b.geometria?.tipo !== "circulo") continue;
      const rvx = (b.fisica?.vx ?? 0) - (a.fisica?.vx ?? 0), rvy = (b.fisica?.vy ?? 0) - (a.fisica?.vy ?? 0);
      const px = b.posicao.x - a.posicao.x, py = b.posicao.y - a.posicao.y;
      const radius = Number(a.geometria.raio ?? 0) + Number(b.geometria.raio ?? 0);
      const aa = rvx*rvx + rvy*rvy, bb = 2*(px*rvx + py*rvy), cc = px*px + py*py - radius*radius;
      if (cc <= 0) { const n=Math.sqrt(px*px+py*py)||1; resultados.push({ sujeito:a.nome,objeto:b.nome,toi:0,normal:{x:px/n,y:py/n} }); continue; }
      if (aa === 0) continue;
      const disc = bb*bb - 4*aa*cc;
      if (disc < 0) continue;
      const t = (-bb - Math.sqrt(disc)) / (2*aa);
      if (t >= 0 && t <= dt) {
        const cx = px + rvx*t, cy = py + rvy*t, n=Math.sqrt(cx*cx+cy*cy)||1;
        resultados.push({ sujeito:a.nome,objeto:b.nome,toi:t,normal:{x:cx/n,y:cy/n} });
      }
    }
    return resultados.sort((a,b) => a.toi-b.toi || a.sujeito.localeCompare(b.sujeito) || a.objeto.localeCompare(b.objeto));
  }

  resolverColisoes(candidatos?: Array<{ sujeito: string; objeto: string }>): Array<{ sujeito: string; objeto: string; colidiu: boolean; normal: { x: number; y: number }; penetracao: number }> {
    const resultados: Array<{ sujeito: string; objeto: string; colidiu: boolean; normal: { x: number; y: number }; penetracao: number }> = [];
    const pares = candidatos ?? this.estadoEntidades.flatMap((a, i) => this.estadoEntidades.slice(i + 1).map(b => ({ sujeito: a.nome, objeto: b.nome })));
    for (const par of pares) {
      const a = this.estadoEntidades.find(e => e.nome === par.sujeito); const b = this.estadoEntidades.find(e => e.nome === par.objeto);
      if (!a || !b) continue;
      if (!a.posicao || !b.posicao || !a.geometria || !b.geometria) continue;
      let nx = b.posicao.x - a.posicao.x; let ny = b.posicao.y - a.posicao.y;
      const d = Math.sqrt(nx * nx + ny * ny) || 0;
      let pen = 0;
      if (a.geometria.tipo === "circulo" && b.geometria.tipo === "circulo") pen = Number(a.geometria.raio ?? 0) + Number(b.geometria.raio ?? 0) - d;
      else if (a.geometria.tipo === "retangulo" && b.geometria.tipo === "retangulo") {
        const ox = (Number(a.geometria.largura ?? 0) + Number(b.geometria.largura ?? 0)) / 2 - Math.abs(nx);
        const oy = (Number(a.geometria.altura ?? 0) + Number(b.geometria.altura ?? 0)) / 2 - Math.abs(ny);
        pen = Math.min(ox, oy);
        if (ox < oy) { nx = Math.sign(nx) || 1; ny = 0; } else { nx = 0; ny = Math.sign(ny) || 1; }
      }
      if (a.geometria.tipo === "circulo" && b.geometria.tipo === "circulo" && d > 0) { nx /= d; ny /= d; }
      if (pen <= 0) { resultados.push({ sujeito: a.nome, objeto: b.nome, colidiu: false, normal: { x: nx, y: ny }, penetracao: 0 }); continue; }
      if (a.geometria.tipo === "circulo" && b.geometria.tipo === "circulo" && d > 0) { /* normal already normalized */ }
      else { const n = Math.sqrt(nx * nx + ny * ny) || 1; nx /= n; ny /= n; }
      const fa = a.fisica; const fb = b.fisica;
      const invA = fa?.bloqueado ? 0 : 1 / Number(fa?.massa ?? 1);
      const invB = fb?.bloqueado ? 0 : 1 / Number(fb?.massa ?? 1);
      const invSum = invA + invB;
      if (invSum > 0) {
        a.posicao.x -= nx * pen * (invA / invSum); a.posicao.y -= ny * pen * (invA / invSum);
        b.posicao.x += nx * pen * (invB / invSum); b.posicao.y += ny * pen * (invB / invSum);
        const rvx = (fb?.vx ?? 0) - (fa?.vx ?? 0); const rvy = (fb?.vy ?? 0) - (fa?.vy ?? 0);
        const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
          const e = Math.min(fa?.restitucao ?? 0, fb?.restitucao ?? 0);
          const impulse = -(1 + e) * vn / invSum;
          if (fa && invA) { fa.vx -= impulse * nx * invA; fa.vy -= impulse * ny * invA; }
          if (fb && invB) { fb.vx += impulse * nx * invB; fb.vy += impulse * ny * invB; }
          const tx = -ny, ty = nx; const vt = rvx * tx + rvy * ty;
          const mu = Math.sqrt((fa?.atrito ?? 0) * (fb?.atrito ?? 0));
          const jt = Math.max(-Math.abs(vt) * mu / invSum, Math.min(Math.abs(vt) * mu / invSum, -vt / invSum));
          if (fa && invA) { fa.vx -= jt * tx * invA; fa.vy -= jt * ty * invA; }
          if (fb && invB) { fb.vx += jt * tx * invB; fb.vy += jt * ty * invB; }
        }
      }
      resultados.push({ sujeito: a.nome, objeto: b.nome, colidiu: true, normal: { x: nx, y: ny }, penetracao: pen });
    }
    return resultados;
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
