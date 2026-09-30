export type TipoOperacaoGoodle =
  | "evento"
  | "condicao"
  | "acao"
  | "dado"
  | "regra";

export interface ExpressaoGoodle {
  tipo: TipoOperacaoGoodle;
  nome: string;
  parametros?: Record<string, unknown>;
  filhos?: ExpressaoGoodle[];
  senao?: ExpressaoGoodle[];
}

export interface FluxoGoodle {
  id: string;
  nome: string;
  quando?: ExpressaoGoodle;
  executar: ExpressaoGoodle[];
}

export interface DadoGoodle {
  id: string;
  nome: string;
  tipo: string;
  persistente: boolean;
  valorInicial?: unknown;
}

export interface RegraSintaxeGoodle {
  id: string;
  nome: string;
  quando?: ExpressaoGoodle;
  permitir: boolean;
}

export interface DefinicaoGoodle {
  componentes: string[];
  fluxos: FluxoGoodle[];
  dados: DadoGoodle[];
  regras: RegraSintaxeGoodle[];
}
