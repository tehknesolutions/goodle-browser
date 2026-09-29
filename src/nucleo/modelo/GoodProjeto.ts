export type Ambiente = "aplicacao" | "jogo" | "hibrido";
export type TipoComponente = "aplicacao" | "jogo" | "sistema";
export type FormaManifestacao = "visual" | "interativa" | "sistema" | "hibrida";

export interface IntencaoGoodle {
  descricao: string;
  objetivo?: string;
  restricoes?: string[];
}

export interface ConfiguracaoComponente { [chave: string]: unknown; }

export interface ComponenteGoodle {
  id: string;
  tipo: TipoComponente;
  nome: string;
  versao: string;
  manifestacao: FormaManifestacao;
  configuracao?: ConfiguracaoComponente;
  componentesFilhos?: string[];
}

export interface CenaGoodle { id: string; nome: string; componentes: string[]; }

export interface RegraGoodle {
  id: string;
  nome: string;
  expressao?: string;
  habilitada: boolean;
}

export interface GoodProjeto {
  id: string;
  nome: string;
  versao: number;
  ambiente: Ambiente;
  intencao: IntencaoGoodle;
  componentes: ComponenteGoodle[];
  cenas: CenaGoodle[];
  regras: RegraGoodle[];
  metadados: Record<string, unknown>;
}

export function criarGoodProjeto(
  entrada: Pick<GoodProjeto, "id" | "nome" | "ambiente" | "intencao">,
): GoodProjeto {
  return { ...entrada, versao: 1, componentes: [], cenas: [], regras: [], metadados: {} };
}
