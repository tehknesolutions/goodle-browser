import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M90 — sleep runtime",()=>{
  it("entra em sleep após steps determinísticos",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
posicionar a em 0 0
massa a para 1
velocidade a para 0 0
aceleracao a para 0 0`),r);
    r.executar(parseOldRewrite("simular fisica 0.016").nos[0]);
    r.executar(parseOldRewrite("simular fisica 0.016").nos[0]);
    r.executar(parseOldRewrite("simular fisica 0.016").nos[0]);
    expect(r.entidades()[0].fisica?.dormindo).toBe(true);
  });
  it("acorda explicitamente",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite(`criar personagem a
massa a para 1
velocidade a para 0 0`),r);
    r.executar(parseOldRewrite("dormir fisica").nos[0]);
    r.executar(parseOldRewrite("acordar fisica").nos[0]);
    expect(r.entidades()[0].fisica?.dormindo).toBe(false);
  });
  it("estado de repouso é observável",()=>{
    const r=new RuntimeMemoria(); new HyperKernel().executar(parseOldRewrite("criar personagem a").nos[0],r);
    const out=r.executar(parseOldRewrite("estado repouso").nos[0]);
    expect(out.valor.estados[0]).toHaveProperty("dormindo");
  });
});
