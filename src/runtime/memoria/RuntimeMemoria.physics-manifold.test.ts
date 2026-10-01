import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M97 — manifold cache",()=>{
  const setup=()=>{const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 2 0
massa a para 1
massa b para 1
definir circulo de a raio 2
definir circulo de b raio 2`),r);return r;};
  it("persiste manifold confirmado pelo narrow phase",()=>{
    const r=setup();const out=r.executar(parseOldRewrite("resolver colisões").nos[0]);expect(out.valor.colisoes.some((x:any)=>x.colidiu)).toBe(true);
    const state=r.executar(parseOldRewrite("manifold estado").nos[0]);expect(state.valor.quantidade).toBeGreaterThan(0);
    expect(state.valor.manifolds[0]).toHaveProperty("normal");expect(state.valor.manifolds[0]).toHaveProperty("penetracao");
  });
  it("reconcilia e remove manifold quando par desaparece",()=>{
    const r=setup();r.executar(parseOldRewrite("resolver colisões").nos[0]);r.entidades()[1].posicao!.x=20;
    const state=r.executar(parseOldRewrite("manifold estado").nos[0]);expect(state.valor.quantidade).toBe(0);
  });
  it("invalidacao de colisão limpa manifold",()=>{
    const r=setup();r.executar(parseOldRewrite("resolver colisões").nos[0]);r.executar(parseOldRewrite("invalidar colisao").nos[0]);
    expect(r.executar(parseOldRewrite("manifold estado").nos[0]).valor.quantidade).toBe(0);
  });
  it("estado é determinístico por identidade do par",()=>{
    const r=setup();r.executar(parseOldRewrite("resolver colisões").nos[0]);const state=r.executar(parseOldRewrite("manifold cache").nos[0]);
    expect(state.valor.manifolds.map((x:any)=>x.sujeito+"/"+x.objeto)).toEqual(["a/b"]);
  });
});
