import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M89 — persistent contact solver",()=>{
  it("mantém cache entre consultas enquanto o contato existe",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    const a=r.executar(parseOldRewrite("contatos persistentes").nos[0]); const b=r.executar(parseOldRewrite("contatos persistentes").nos[0]);
    expect(a.valor.cache).toHaveLength(1); expect(b.valor.cache).toHaveLength(1);
  });
  it("remove contato desaparecido deterministicamente",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    r.executar(parseOldRewrite("contatos persistentes").nos[0]);
    const b=r.entidades()[1]; b.posicao!.x=10;
    const out=r.executar(parseOldRewrite("contatos persistentes").nos[0]);
    expect(out.valor.cache).toHaveLength(0);
  });
  it("resolve contato com impulso acumulado não-negativo",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0
massa a para 1
massa b para 1
velocidade a para 1 0
velocidade b para -1 0
definir circulo de a raio 1
definir circulo de b raio 1
restituicao a para 0
restituicao b para 0`),r);
    const out=r.executar(parseOldRewrite("resolver contatos persistentes").nos[0]);
    expect(out.valor.resolvidos[0].impulsoNormal).toBeGreaterThan(0);
  });
});
