import { DICIONARIO_SEMANTICO_V1 } from "../semantica/DicionarioSemantico";
import type { FamiliaIR, GoodleIRNode, GoodleIRPrograma } from "./GoodleIR";

export type DiagnosticoIR = {
  caminho: string;
  codigo: "SEMANTICA_DESCONHECIDA" | "FAMILIA_INVALIDA" | "COMPORTAMENTO_SEM_ACAO" | "PARAMETRO_OBRIGATORIO_AUSENTE" | "OPERADOR_CONDICAO_INVALIDO";
  mensagem: string;
};

const familiasValidas = new Set<FamiliaIR>(["estrutura", "dados", "comportamento", "mundo", "execucao"]);
const semanticasValidas = new Set(DICIONARIO_SEMANTICO_V1.map((item) => item.idCanonico));

const requisitos: Record<string, string[]> = {
  "comportamento.reacao.quando": ["evento"],
  "estrutura.cena": ["nome"],
  "cena.transicao": ["destino"],
  "espaco.posicao": ["nome", "x", "y"],
  "espaco.movimento": ["nome", "x", "y"],
  "espaco.rotacao": ["nome", "graus"],
  "espaco.escala": ["nome", "x", "y"],
  "geometria.ponto": ["nome"],
  "geometria.circulo": ["nome", "raio"],
  "geometria.retangulo": ["nome", "largura", "altura"],
  "fisica.velocidade": ["nome", "x", "y"],
  "fisica.aceleracao": ["nome", "x", "y"],
  "fisica.gravidade": ["nome", "x", "y"],
  "fisica.massa": ["nome", "valor"],
  "fisica.impulso": ["nome", "x"],
  "fisica.atualizar": ["dt"],
  "fisica.limite": ["xMin", "xMax", "yMin", "yMax"],
  "fisica.superficie": ["y"],
  "fisica.atrito": ["nome", "valor"],
  "fisica.restituicao": ["nome", "valor"],
  "fisica.bloqueio": ["nome"],
  "fisica.aplicar_regras": ["dt"],
  "fisica.colisao_resolver": [],
  "fisica.simular": ["dt"],
  "fisica.iteracoes": ["valor"],
  "entidade.ativar": ["nome"],
  "entidade.desativar": ["nome"],
  "entidade.spawn": ["nome"],
  "entidade.despawn": ["nome"],
  "dados.valor.definir": ["entidade", "propriedade", "valor"],
  "dados.valor.diminuir": ["entidade", "propriedade", "valor"],
  "dados.valor.aumentar": ["entidade", "propriedade", "valor"],
  "logica.condicao.se": [],
};

function parametroAusente(valor: unknown): boolean {
  return valor === undefined || valor === null || (typeof valor === "string" && valor.trim() === "");
}

function validarNo(no: GoodleIRNode, caminho: string, diagnosticos: DiagnosticoIR[]): void {
  if (!semanticasValidas.has(no.semantica)) {
    diagnosticos.push({ caminho: `${caminho}.semantica`, codigo: "SEMANTICA_DESCONHECIDA", mensagem: `Semântica desconhecida: ${no.semantica}` });
  }

  if (!familiasValidas.has(no.familia)) {
    diagnosticos.push({ caminho: `${caminho}.familia`, codigo: "FAMILIA_INVALIDA", mensagem: `Família IR inválida: ${String(no.familia)}` });
  }

  for (const parametro of requisitos[no.semantica] ?? []) {
    if (parametroAusente(no.parametros?.[parametro])) {
      diagnosticos.push({
        caminho: `${caminho}.parametros.${parametro}`,
        codigo: "PARAMETRO_OBRIGATORIO_AUSENTE",
        mensagem: `Parâmetro obrigatório ausente: ${parametro}`,
      });
    }
  }

  if (no.semantica === "logica.condicao.se" && no.parametros?.relacao) {
    for (const parametro of ["sujeito", "objeto", "relacao"]) {
      if (parametroAusente(no.parametros?.[parametro])) diagnosticos.push({ caminho: `${caminho}.parametros.${parametro}`, codigo: "PARAMETRO_OBRIGATORIO_AUSENTE", mensagem: `Parâmetro obrigatório ausente: ${parametro}` });
    }
  } else if (no.semantica === "logica.condicao.se") {
    for (const parametro of ["entidade", "propriedade", "operador", "valor"]) {
      if (parametroAusente(no.parametros?.[parametro])) diagnosticos.push({ caminho: `${caminho}.parametros.${parametro}`, codigo: "PARAMETRO_OBRIGATORIO_AUSENTE", mensagem: `Parâmetro obrigatório ausente: ${parametro}` });
    }
  }

  if (no.semantica === "comportamento.reacao.quando") {
    const evento = String(no.parametros?.evento ?? "");
    if (["evento.temporizador.disparar", "evento.tempo.esperar", "evento.tempo.intervalo"].includes(evento) && parametroAusente(no.parametros?.duracaoMs)) {
      diagnosticos.push({ caminho: `${caminho}.parametros.duracaoMs`, codigo: "PARAMETRO_OBRIGATORIO_AUSENTE", mensagem: "Duração temporal obrigatória ausente" });
    }
  }

  if (no.semantica === "comportamento.reacao.quando") {
    const evento = String(no.parametros?.evento ?? "");
    if (evento === "evento.toque") {
      for (const parametro of ["fonte", "alvo"]) {
        if (parametroAusente(no.parametros?.[parametro])) {
          diagnosticos.push({
            caminho: `${caminho}.parametros.${parametro}`,
            codigo: "PARAMETRO_OBRIGATORIO_AUSENTE",
            mensagem: `Parâmetro obrigatório ausente: ${parametro}`,
          });
        }
      }
    }
  }

  if (no.semantica === "logica.condicao.se" && !["maior_que", "menor_que", "igual"].includes(String(no.parametros?.operador))) {
    diagnosticos.push({ caminho: `${caminho}.parametros.operador`, codigo: "OPERADOR_CONDICAO_INVALIDO", mensagem: `Operador de condição inválido: ${String(no.parametros?.operador)}` });
  }

  if (no.semantica === "comportamento.reacao.quando" && (!no.filhos || no.filhos.length === 0)) {
    diagnosticos.push({ caminho: `${caminho}.filhos`, codigo: "COMPORTAMENTO_SEM_ACAO", mensagem: "Comportamento reativo precisa de pelo menos uma ação filha" });
  }

  if (no.semantica === "logica.condicao.se" && (!no.filhos || no.filhos.length === 0)) {
    diagnosticos.push({ caminho: `${caminho}.filhos`, codigo: "COMPORTAMENTO_SEM_ACAO", mensagem: "Condição precisa de pelo menos uma ação filha" });
  }

  no.filhos?.forEach((filho, indice) => validarNo(filho, `${caminho}.filhos[${indice}]`, diagnosticos));
}

export function validarGoodleIR(programa: GoodleIRPrograma): DiagnosticoIR[] {
  const diagnosticos: DiagnosticoIR[] = [];
  programa.nos.forEach((item, indice) => validarNo(item, `nos[${indice}]`, diagnosticos));
  return diagnosticos;
}
