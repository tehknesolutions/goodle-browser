import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M93 — broadphase integration",()=>{
  const setup=()=>{const r=new RuntimeMemoria();new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
criar personagem longe
posicionar a em 0 0
posicionar b em 2 0
posicionar longe em 100 100
definir circulo de a raio 2
definir circulo de b raio 2
definir circulo de longe raio 1`),r);return r;};
  it("usa broadphase no resolver e descarta corpo distante",()=>{
    const r=setup();r.executar(parseOldRewrite("ativar broadphase").nos[0]);const out=r.executar(parseOldRewrite("resolver colisões").nos[0]);
    expect(out.valor.estrategia).toBe("broadphase");expect(out.valor.colisoes).toHaveLength(1);expect(out.valor.colisoes[0]).toMatchObject({sujeito:"a",objeto:"b",colidiu:true});
  });
  it("fallback all-pairs permanece disponível",()=>{
    const r=setup();const out=r.executar(parseOldRewrite("resolver colisões").nos[0]);
    expect(out.valor.estrategia).toBe("all-pairs");expect(out.valor.colisoes).toHaveLength(3);
  });
  it("resultado de colisão é equivalente no par relevante",()=>{
    const a=setup();const b=setup();a.executar(parseOldRewrite("ativar broadphase").nos[0]);
    const ra=a.executar(parseOldRewrite("resolver colisões").nos[0]);const rb=b.executar(parseOldRewrite("resolver colisões").nos[0]);
    expect(ra.valor.colisoes[0]).toMatchObject({sujeito:"a",objeto:"b",colidiu:true});
    expect(rb.valor.colisoes.find((x:any)=>x.sujeito==="a"&&x.objeto==="b")).toMatchObject({colidiu:true});
  });
});
