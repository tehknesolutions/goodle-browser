import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M99 — sequential impulse solver state",()=>{
  const setup=()=>{const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1.5 0
massa a para 1
massa b para 1
definir circulo de a raio 1
definir circulo de b raio 1`),r);return r;};
  it("primeiro estado começa vazio",()=>expect(setup().executar(parseOldRewrite("solver estado").nos[0]).valor.quantidade).toBe(0));
  it("iterar cria estado por contato",()=>{const r=setup();const out=r.executar(parseOldRewrite("solver iterar").nos[0]);expect(out.valor.contatos).toHaveLength(1);const s=r.executar(parseOldRewrite("solver estado").nos[0]);expect(s.valor.quantidade).toBe(1);expect(s.valor.contatos[0].par).toBe("a/b");expect(Number.isFinite(s.valor.contatos[0].impulsoNormal)).toBe(true);});
  it("iterações acumulam deterministicamente",()=>{const r=setup();r.executar(parseOldRewrite("solver iterar").nos[0]);r.executar(parseOldRewrite("solver iterar").nos[0]);expect(r.executar(parseOldRewrite("solver estado").nos[0]).valor.contatos[0].iteracoes).toBe(2);});
  it("estado desaparece quando o par perde coerência",()=>{const r=setup();r.executar(parseOldRewrite("solver iterar").nos[0]);r.entidades()[1].posicao!.x=20;expect(r.executar(parseOldRewrite("solver estado").nos[0]).valor.quantidade).toBe(0);});
  it("aplicar é determinístico",()=>{const r=setup();r.executar(parseOldRewrite("solver iterar").nos[0]);const out=r.executar(parseOldRewrite("solver aplicar").nos[0]);expect(out.valor.aplicado).toBe(1);expect(out.valor.contatos).toEqual(["a/b"]);});
  it("invalidação global limpa solver state",()=>{const r=setup();r.executar(parseOldRewrite("solver iterar").nos[0]);r.executar(parseOldRewrite("invalidar colisao").nos[0]);expect(r.executar(parseOldRewrite("solver estado").nos[0]).valor.quantidade).toBe(0);});
});
