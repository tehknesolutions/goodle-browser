import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M98 — warm start",()=>{
  const setup=()=>{const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1.5 0
massa a para 1
massa b para 1
definir circulo de a raio 1
definir circulo de b raio 1`),r);return r;};
  it("primeiro contato não aplica estado inexistente",()=>{
    const r=setup();r.executar(parseOldRewrite("warm start").nos[0]);const s=r.executar(parseOldRewrite("warm start estado").nos[0]);expect(s.valor.manifolds).toEqual([]);
  });
  it("contato confirmado produz estado reutilizável",()=>{
    const r=setup();r.executar(parseOldRewrite("resolver colisões").nos[0]);const s=r.executar(parseOldRewrite("warm start estado").nos[0]);
    expect(s.valor.manifolds).toHaveLength(1);expect(s.valor.manifolds[0].par).toBe("a/b");
  });
  it("aplicação explícita é determinística",()=>{
    const r=setup();r.executar(parseOldRewrite("resolver colisões").nos[0]);const antes=r.entidades().map(e=>({n:e.nome,vx:e.fisica?.vx??0,vy:e.fisica?.vy??0}));
    const out=r.executar(parseOldRewrite("aplicar warm start").nos[0]);expect(out.valor.ativo).toBe(true);expect(out.valor.aplicado).toBe(1);expect(r.entidades().map(e=>e.nome)).toEqual(["a","b"]);
    expect(antes.length).toBe(2);
  });
  it("movimento invalida estado obsoleto",()=>{
    const r=setup();r.executar(parseOldRewrite("resolver colisões").nos[0]);r.entidades()[1].posicao!.x=20;
    const s=r.executar(parseOldRewrite("warm start estado").nos[0]);expect(s.valor.manifolds).toEqual([]);
  });
  it("invalidação M96 limpa warm start",()=>{
    const r=setup();r.executar(parseOldRewrite("resolver colisões").nos[0]);r.executar(parseOldRewrite("invalidar colisao").nos[0]);
    expect(r.executar(parseOldRewrite("warm start estado").nos[0]).valor.manifolds).toEqual([]);
  });
});
