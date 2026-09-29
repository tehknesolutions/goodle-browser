import type { GoodProjeto } from "../modelo/GoodProjeto";

export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
}

export function validarGoodProjeto(projeto: GoodProjeto): ResultadoValidacao {
  const erros: string[] = [];

  if (!projeto.id.trim()) erros.push("O projeto precisa de um id.");
  if (!projeto.nome.trim()) erros.push("O projeto precisa de um nome.");
  if (!projeto.intencao.descricao.trim()) {
    erros.push("O projeto precisa de uma descrição de intenção.");
  }

  const ids = new Set<string>();

  for (const componente of projeto.componentes) {
    if (ids.has(componente.id)) {
      erros.push(`Id de componente duplicado: ${componente.id}.`);
    }
    ids.add(componente.id);
  }

  for (const cena of projeto.cenas) {
    for (const id of cena.componentes) {
      if (!ids.has(id)) {
        erros.push(`A cena "${cena.nome}" referencia o componente inexistente "${id}".`);
      }
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
