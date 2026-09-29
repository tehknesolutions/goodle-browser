import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
import { HyperKernel } from "../../runtime/HyperKernel";
import { RuntimeMemoria } from "../../runtime/memoria/RuntimeMemoria";

describe("Goodle IR V1 ponta a ponta", () => {
  it("materializa um personagem escrito em OldRewrite", () => {
    const programa = parseOldRewrite("criar personagem heroi");
    expect(validarGoodleIR(programa)).toEqual([]);

    const runtime = new RuntimeMemoria();
    const resultado = new HyperKernel().executar(programa, runtime);

    expect(resultado.estado).toBe("concluido");
    expect(resultado.resultados).toHaveLength(1);
    expect(resultado.resultados[0]).toMatchObject({ estado: "executado", semantica: "entidade.criar" });
    expect(runtime.entidades()).toEqual([{ nome: "heroi", tipo: "personagem" }]);
  });
});
