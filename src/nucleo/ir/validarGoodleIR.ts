import { DICIONARIO_SEMANTICO_V1 } from "../semantica/DicionarioSemantico";
import type { FamiliaIR, GoodleIRNode, GoodleIRPrograma } from "./GoodleIR";

export type DiagnosticoIR = {
  caminho: string;
  codigo: "SEMANTICA_DESCONHECIDA" | "FAMILIA_INVALIDA";
  mensagem: string;
};

const familiasValidas = new Set<FamiliaIR>(["estrutura", "dados", "comportamento", "mundo", "execucao"]);
const semanticasValidas = new Set(DICIONARIO_SEMANTICO_V1.map((item) => item.idCanonico));

function validarNo(no: GoodleIRNode, caminho: string, diagnosticos: DiagnosticoIR[]): void {
  if (!semanticasValidas.has(no.semantica)) {
    diagnosticos.push({
      caminho: `${caminho}.semantica`,
      codigo: "SEMANTICA_DESCONHECIDA",
      mensagem: `Semântica desconhecida: ${no.semantica}`,
    });
  }

  if (!familiasValidas.has(no.familia)) {
    diagnosticos.push({
      caminho: `${caminho}.familia`,
      codigo: "FAMILIA_INVALIDA",
      mensagem: `Família IR inválida: ${String(no.familia)}`,
    });
  }

  no.filhos?.forEach((filho, indice) => validarNo(filho, `${caminho}.filhos[${indice}]`, diagnosticos));
}

export function validarGoodleIR(programa: GoodleIRPrograma): DiagnosticoIR[] {
  const diagnosticos: DiagnosticoIR[] = [];
  programa.nos.forEach((no, indice) => validarNo(no, `nos[${indice}]`, diagnosticos));
  return diagnosticos;
}
