import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M91 — wake and islands",()=>{
  it("calcula ilha determinística a partir de contato persistente",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    r.executar(parseOldRewrite("contatos persistentes").nos[0]);
    const out=r.executar(parseOldRewrite("ilhas").nos[0]);
    expect(out.valor.ilhas).toEqual([{id:"a|b",membros:["a","b"]}]);
  });
  it("wake ativa membros da ilha conectada",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0
massa a para 1
massa b para 1
definir circulo de a raio 1
definir circulo de b raio 1
dormir fisica`),r);
    r.executar(parseOldRewrite("contatos persistentes").nos[0]);
    const out=r.executar(parseOldRewrite("evento acordar").nos[0]);
    expect(out.valor.acordadas).toEqual(["a","b"]);
  });
  it("remove conexão quando contato desaparece",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    r.executar(parseOldRewrite("contatos persistentes").nos[0]);
    r.entidades()[1].posicao!.x=10;
    const out=r.executar(parseOldRewrite("ilhas").nos[0]);
    expect(out.valor.ilhas).toEqual([{id:"a",membros:["a"]},{id:"b",membros:["b"]}]);
  });
});
