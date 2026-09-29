import type { GoodleIRPrograma } from "../nucleo/ir/GoodleIR";
import { validarGoodleIR, type DiagnosticoIR } from "../nucleo/ir/validarGoodleIR";
import type { ResultadoExecucao, RuntimeGoodle } from "./ContratoRuntimeGoodle";

export type ResultadoHyperKernel =
  | { estado: "ir_invalido"; diagnosticos: DiagnosticoIR[]; resultados: [] }
  | { estado: "concluido"; diagnosticos: []; resultados: ResultadoExecucao[] };

export class HyperKernel {
  executar(programa: GoodleIRPrograma, runtime: RuntimeGoodle): ResultadoHyperKernel {
    const diagnosticos = validarGoodleIR(programa);
    if (diagnosticos.length > 0) return { estado: "ir_invalido", diagnosticos, resultados: [] };

    const resultados = programa.nos.map((no): ResultadoExecucao => {
      if (!runtime.suporta(no.semantica)) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };
      if (no.semantica === "comportamento.reacao.quando") {
        if (!runtime.registrar) return { estado: "nao_suportado", idNo: no.id, semantica: no.semantica };
        return runtime.registrar(no);
      }
      return runtime.executar(no);
    });

    return { estado: "concluido", diagnosticos: [], resultados };
  }
}
