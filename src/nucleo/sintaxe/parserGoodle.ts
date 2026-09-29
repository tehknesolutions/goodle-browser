import type {
  ExpressaoGoodle,
  FluxoGoodle,
} from "../modelo/SintaxeGoodle";

export interface ResultadoLeituraGoodle {
  sucesso: boolean;
  fluxo?: FluxoGoodle;
  erros: string[];
}

/**
 * Leitor inicial da sintaxe declarativa Goodle.
 *
 * Formato suportado nesta primeira versão:
 *
 * quando jogador entrar na cidade:
 *   carregar perfil
 *   mostrar missão atual
 *   abrir diálogo do NPC
 *
 * Esta implementação é deliberadamente pequena.
 * O objetivo é estabelecer a fronteira da linguagem, não criar ainda
 * um compilador completo.
 */
export function lerFluxoGoodle(
  texto: string,
  id = "fluxo-1",
): ResultadoLeituraGoodle {
  const linhas = texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhas.length === 0) {
    return { sucesso: false, erros: ["A sintaxe está vazia."] };
  }

  const primeira = linhas[0];
  const separador = primeira.indexOf(":");

  if (!primeira.startsWith("quando ") || separador === -1) {
    return {
      sucesso: false,
      erros: [
        'O fluxo precisa começar com "quando" e terminar a declaração do evento com ":".',
      ],
    };
  }

  const eventoNome = primeira.slice(7, separador).trim();

  if (!eventoNome) {
    return { sucesso: false, erros: ["O evento não foi informado."] };
  }

  const executar: ExpressaoGoodle[] = linhas.slice(1).map((linha) => ({
    tipo: "acao",
    nome: linha,
  }));

  if (executar.length === 0) {
    return {
      sucesso: false,
      erros: ["O fluxo precisa possuir pelo menos uma ação."],
    };
  }

  return {
    sucesso: true,
    erros: [],
    fluxo: {
      id,
      nome: eventoNome,
      quando: {
        tipo: "evento",
        nome: eventoNome,
      },
      executar,
    },
  };
}
