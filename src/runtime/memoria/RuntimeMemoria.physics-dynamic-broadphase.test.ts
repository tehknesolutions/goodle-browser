import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M94 — dynamic broadphase",()=>{
  it("move atualiza candidatos sem reconstrução global implícita",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 2 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    r.executar(parseOldRewrite("broadphase").nos[0]);
    r.entidades()[1].posicao!.x=20;
    expect(r.executar(parseOldRewrite("candidatos colisao").nos[0]).valor.candidatos).toEqual([]);
    r.entidades()[1].posicao!.x=2;
    expect(r.executar(parseOldRewrite("candidatos colisao").nos[0]).valor.candidatos).toEqual([{sujeito:"a",objeto:"b"}]);
  });
  it("alteração geométrica atualiza o proxy",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 5 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    r.executar(parseOldRewrite("broadphase").nos[0]);
    expect(r.executar(parseOldRewrite("candidatos colisao").nos[0]).valor.candidatos).toEqual([]);
    r.executar(parseOldRewrite("definir circulo de a raio 5").nos[0]);
    expect(r.executar(parseOldRewrite("candidatos colisao").nos[0]).valor.candidatos).toEqual([{sujeito:"a",objeto:"b"}]);
  });
  it("rebuild é equivalente ao estado incremental",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 2 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    const before=r.executar(parseOldRewrite("candidatos colisao").nos[0]).valor.candidatos;
    r.executar(parseOldRewrite("reconstruir broadphase").nos[0]);
    const after=r.executar(parseOldRewrite("candidatos colisao").nos[0]).valor.candidatos;
    expect(after).toEqual(before);
  });
  it("estado é serializável e determinístico",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem z
criar personagem a
posicionar z 0 0
posicionar a 1 0
definir circulo de z raio 1
definir circulo de a raio 1`),r);
    const out=r.executar(parseOldRewrite("estado broadphase").nos[0]);
    expect(out.valor.celulas.length).toBeGreaterThan(0);
    expect(out.valor.proxies.map((x:any)=>x.nome)).toEqual(["a","z"]);
  });
});
