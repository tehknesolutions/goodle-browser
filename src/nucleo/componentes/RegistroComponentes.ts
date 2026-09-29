import type { ComponenteGoodle, TipoComponente } from "../modelo/GoodProjeto";

export interface DefinicaoComponente {
  tipo: TipoComponente;
  nome: string;
  versao: string;
  descricao: string;
  criar: (id: string) => ComponenteGoodle;
}

export class RegistroComponentes {
  private readonly definicoes = new Map<string, DefinicaoComponente>();

  registrar(definicao: DefinicaoComponente): void {
    if (this.definicoes.has(definicao.nome)) {
      throw new Error(`O componente "${definicao.nome}" já está registrado.`);
    }

    this.definicoes.set(definicao.nome, definicao);
  }

  obter(nome: string): DefinicaoComponente | undefined {
    return this.definicoes.get(nome);
  }

  listar(): DefinicaoComponente[] {
    return [...this.definicoes.values()];
  }

  criar(nome: string, id: string): ComponenteGoodle {
    const definicao = this.obter(nome);

    if (!definicao) {
      throw new Error(`Componente "${nome}" não encontrado.`);
    }

    return definicao.criar(id);
  }
}
