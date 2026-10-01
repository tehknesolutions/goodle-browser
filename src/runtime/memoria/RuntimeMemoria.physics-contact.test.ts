import { describe, expect, it } from "vitest";
import { HyperKernel } from "../HyperKernel";
import { RuntimeMemoria } from "./RuntimeMemoria";
import { parseOldRewrite } from "../../nucleo/oldrewrite/ParserOldRewrite";
describe("M88 — contact manifold and CCD",()=>{
  it("produz manifold serializável",()=>{
    const r=new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 1 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    const out=r.executar(parseOldRewrite("contatos").nos[0]);
    expect(out.valor.contatos[0]).toMatchObject({sujeito:"a",objeto:"b",normal:{x:1,y:0},penetracao:1});
    expect(out.valor.contatos[0].pontos).toHaveLength(1);
  });
  it("detecta circle-circle tunneling com TOI",()=>{
    const r=new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem a
criar personagem b
posicionar a em 0 0
posicionar b em 10 0
massa a para 1
massa b para 1
velocidade a para 20 0
definir circulo de a raio 1
definir circulo de b raio 1`),r);
    r.executar(parseOldRewrite("colisao continua").nos[0]);
    const out=r.executar(parseOldRewrite("simular fisica 0.5").nos[0]);
    expect(out.valor.ccd[0]).toMatchObject({sujeito:"a",objeto:"b"});
    expect(out.valor.ccd[0].toi).toBeCloseTo(0.4);
  });
  it("mantém contatos deterministicamente ordenados",()=>{
    const r=new RuntimeMemoria();
    new HyperKernel().executar(parseOldRewrite(`criar personagem z
criar personagem a
posicionar z 0 0
posicionar a 1 0
definir circulo de z raio 1
definir circulo de a raio 1`),r);
    const out=r.executar(parseOldRewrite("contatos").nos[0]);
    expect(out.valor.contatos.map((x:any)=>x.sujeito)).toEqual(["a","z"]);
  });
});
