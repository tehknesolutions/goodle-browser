import type { ExpressaoGoodle, FluxoGoodle } from "../modelo/SintaxeGoodle";

export interface ResultadoLeituraGoodle {
  sucesso: boolean;
  fluxo?: FluxoGoodle;
  erros: string[];
}

interface LinhaGoodle {
  nivel: number;
  texto: string;
}

function prepararLinhas(texto: string): LinhaGoodle[] {
  return texto
    .split("\n")
    .filter((linha) => linha.trim().length > 0)
    .map((linha) => {
      const espacos = linha.match(/^\s*/)?.[0].length ?? 0;
      return { nivel: Math.floor(espacos / 2), texto: linha.trim() };
    });
}

function lerBloco(
  linhas: LinhaGoodle[],
  inicio: number,
  nivel: number,
): { expressoes: ExpressaoGoodle[]; proximo: number } {
  const expressoes: ExpressaoGoodle[] = [];
  let indice = inicio;

  while (indice < linhas.length) {
    const linha = linhas[indice];
    if (linha.nivel < nivel) break;
    if (linha.nivel > nivel) {
      throw new Error(`Indentação inesperada em: ${linha.texto}`);
    }
    if (linha.texto === "senão:") break;

    if (linha.texto.startsWith("se ") && linha.texto.endsWith(":")) {
      const nome = linha.texto.slice(3, -1).trim();
      const corpo = lerBloco(linhas, indice + 1, nivel + 1);
      const condicao: ExpressaoGoodle = {
        tipo: "condicao",
        nome,
        filhos: corpo.expressoes,
      };
      indice = corpo.proximo;

      if (
        indice < linhas.length &&
        linhas[indice].nivel === nivel &&
        linhas[indice].texto === "senão:"
      ) {
        const alternativo = lerBloco(linhas, indice + 1, nivel + 1);
        condicao.senao = alternativo.expressoes;
        indice = alternativo.proximo;
      }

      expressoes.push(condicao);
      continue;
    }

    expressoes.push({ tipo: "acao", nome: linha.texto });
    indice += 1;
  }

  return { expressoes, proximo: indice };
}

export function lerFluxoGoodle(
  texto: string,
  id = "fluxo-1",
): ResultadoLeituraGoodle {
  const linhas = prepararLinhas(texto);

  if (linhas.length === 0) {
    return { sucesso: false, erros: ["A sintaxe está vazia."] };
  }

  const primeira = linhas[0];
  if (
    primeira.nivel !== 0 ||
    !primeira.texto.startsWith("quando ") ||
    !primeira.texto.endsWith(":")
  ) {
    return {
      sucesso: false,
      erros: ['O fluxo precisa começar com "quando" e terminar o evento com ":".'],
    };
  }

  const eventoNome = primeira.texto.slice(7, -1).trim();
  if (!eventoNome) {
    return { sucesso: false, erros: ["O evento não foi informado."] };
  }

  try {
    const corpo = lerBloco(linhas, 1, 1);
    if (corpo.expressoes.length === 0) {
      return { sucesso: false, erros: ["O fluxo precisa possuir pelo menos uma ação."] };
    }
    if (corpo.proximo !== linhas.length) {
      return { sucesso: false, erros: [`Bloco inesperado: ${linhas[corpo.proximo].texto}`] };
    }

    return {
      sucesso: true,
      erros: [],
      fluxo: {
        id,
        nome: eventoNome,
        quando: { tipo: "evento", nome: eventoNome },
        executar: corpo.expressoes,
      },
    };
  } catch (erro) {
    return {
      sucesso: false,
      erros: [erro instanceof Error ? erro.message : "Erro desconhecido na sintaxe."],
    };
  }
}
