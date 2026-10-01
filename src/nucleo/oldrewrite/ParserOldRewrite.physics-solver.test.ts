import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M87 — physics solver", () => {
  it("converge simulação e configuração de iterações", () => {
    const p = parseOldRewrite(`iterações 8
simular fisica 0.016`);
    expect(p.nos.map((n) => n.semantica)).toEqual(["fisica.iteracoes","fisica.simular"]);
  });
});
