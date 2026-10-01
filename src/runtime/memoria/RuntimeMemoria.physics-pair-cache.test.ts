import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M95 — pair cache",()=>{
  const setup=()=>{const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
criar personagem longe
posicionar a em 0 0
posicionar b em 2 0
posicionar longe em 100 100
definir circulo de a raio 2
definir circulo de b raio 2
definir circulo de longe raio 1`),r);return r;};
  it("reutiliza cache quando proxies não mudam",()=>{
    const r=setup();const a=r.executar(parseOldRewrite("cache pares broadphase").nos[0]);const b=r.executar(parseOldRewrite("cache pares broadphase").nos[0]);
    expect(a.valor.pares).toEqual([{sujeito:"a",objeto:"b"}]);expect(b.valor.pares).toEqual(a.valor.pares);
    expect(r.executar(parseOldRewrite("estado pares broadphase").nos[0]).valor.presente).toBe(true);
  });
  it("invalida quando posição muda",()=>{
    const r=setup();r.executar(parseOldRewrite("cache pares broadphase").nos[0]);r.entidades()[1].posicao!.x=20;
    expect(r.executar(parseOldRewrite("cache pares broadphase").nos[0]).valor.pares).toEqual([]);
  });
  it("invalida quando entidade desaparece do estado espacial",()=>{
    const r=setup();r.executar(parseOldRewrite("cache pares broadphase").nos[0]);r.entidades()[1].posicao=undefined;
    expect(r.executar(parseOldRewrite("cache pares broadphase").nos[0]).valor.pares).toEqual([]);
  });
  it("ordem permanece determinística",()=>{
    const r=setup();const out=r.executar(parseOldRewrite("cache pares broadphase").nos[0]);
    expect(out.valor.pares.map((x:any)=>x.sujeito+"/"+x.objeto)).toEqual(["a/b"]);
  });
});
