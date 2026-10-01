import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M92 — broadphase",()=>{
  it("gera candidatos para AABBs sobrepostas",()=>{
    const r=new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
criar personagem longe
posicionar a em 0 0
posicionar b em 2 0
posicionar longe em 100 100
definir circulo de a raio 2
definir circulo de b raio 2
definir circulo de longe raio 1`),r);
    const out=r.executar(parseOldRewrite("candidatos colisao").nos[0]);
    expect(out.valor.candidatos).toEqual([{sujeito:"a",objeto:"b"}]);
  });
  it("não duplica pares quando entidades compartilham células",()=>{
    const r=new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 1 1
posicionar b em 2 2
definir retangulo de a 8 8
definir retangulo de b 8 8`),r);
    const out=r.executar(parseOldRewrite("broadphase").nos[0]);
    expect(out.valor.candidatos).toEqual([{sujeito:"a",objeto:"b"}]);
  });
  it("ordena candidatos deterministicamente",()=>{
    const r=new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem z
criar personagem a
criar personagem m
posicionar z 0 0
posicionar a 1 0
posicionar m 2 0
definir circulo de z raio 2
definir circulo de a raio 2
definir circulo de m raio 2`),r);
    const out=r.executar(parseOldRewrite("candidatos colisao").nos[0]);
    expect(out.valor.candidatos.map((x:any)=>x.sujeito+"/"+x.objeto)).toEqual(["a/m","a/z","m/z"]);
  });
});
