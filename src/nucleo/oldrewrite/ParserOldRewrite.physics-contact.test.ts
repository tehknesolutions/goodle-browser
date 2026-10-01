import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M88 — contacts", () => {
  it("converge contatos, CCD e resolução", () => {
    const p=parseOldRewrite("contatos\ncolisao continua\nresolver contatos");
    expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.contatos","fisica.colisao_continua","fisica.resolver_contatos"]);
  });
});
