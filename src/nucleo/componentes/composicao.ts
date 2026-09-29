import type { ComponenteGoodle, GoodProjeto } from "../modelo/GoodProjeto";

export function adicionarComponente(
  projeto: GoodProjeto,
  componente: ComponenteGoodle,
): GoodProjeto {
  if (projeto.componentes.some((item) => item.id === componente.id)) {
    throw new Error(`Já existe um componente com o id "${componente.id}".`);
  }

  return {
    ...projeto,
    versao: projeto.versao + 1,
    componentes: [...projeto.componentes, componente],
  };
}

export function adicionarComponentes(
  projeto: GoodProjeto,
  componentes: ComponenteGoodle[],
): GoodProjeto {
  return componentes.reduce(adicionarComponente, projeto);
}

export function obterComponente(
  projeto: GoodProjeto,
  id: string,
): ComponenteGoodle | undefined {
  return projeto.componentes.find((componente) => componente.id === id);
}
