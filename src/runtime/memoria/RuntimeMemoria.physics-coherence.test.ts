import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M96 — collision coherence",()=>{
  it("mantém estado coerente para candidato ativo",()=>{
    const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 2 0
definir circulo de a raio 2
definir circulo de b raio 2`),r);
    const out=r.executar(parseOldRewrite("coerencia colisao").nos[0]);
    expect(out.valor.coerente).toBe(true);
  });
  it("remove estado obsoleto quando par desaparece",()=>{
    const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 2 0
definir circulo de a raio 2
definir circulo de b raio 2`),r);
    r.executar(parseOldRewrite("coerencia colisao").nos[0]);
    r.entidades()[1].posicao!.x=20;
    const out=r.executar(parseOldRewrite("estado colisao").nos[0]);
    expect(out.valor.candidatos).toEqual([]);
  });
  it("invalidacao global limpa narrowphase cache",()=>{
    const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite("criar personagem a").nos[0],r);
    const out=r.executar(parseOldRewrite("invalidar colisao").nos[0]);
    expect(out.valor.invalidado).toBe(true);
  });
});
