import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
import { HyperKernel } from "../../runtime/HyperKernel";
import { RuntimeMemoria } from "../../runtime/memoria/RuntimeMemoria";

const fonte = `criar personagem heroi
criar personagem inimigo
definir vida de heroi como 100
quando heroi tocar inimigo:
  diminuir vida de heroi em 10`;

describe("Goodle Behavior/Event V1 — E2E", () => {
  it("executa OldRewrite -> IR -> validação -> HyperKernel -> evento -> vida 90", () => {
    const programa = parseOldRewrite(fonte);
    expect(validarGoodleIR(programa)).toEqual([]);

    const runtime = new RuntimeMemoria();
    const resultadoKernel = new HyperKernel().executar(programa, runtime);
    expect(resultadoKernel.estado).toBe("concluido");
    expect(resultadoKernel.resultados.every((resultado) => resultado.estado === "executado")).toBe(true);

    const resultadoEvento = runtime.emitir({ semantica: "evento.toque", fonte: "heroi", alvo: "inimigo" });
    expect(resultadoEvento).toMatchObject({ estado: "executado", acoesExecutadas: 1 });
    expect(runtime.entidades().find((entidade) => entidade.nome === "heroi")?.propriedades?.vida).toBe(90);
  });
});
