import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M85 — physics rules", () => {
  it("converge limite, superfície, atrito, restituição, bloqueio e regras", () => {
    const p = parseOldRewrite(`limite -10 10 -5 5
superficie 0
atrito heroi para 0.5
restituicao heroi para 0.8
bloqueio heroi
aplicar regras 0.016`);
    expect(p.nos.map((n) => n.semantica)).toEqual([
      "fisica.limite","fisica.superficie","fisica.atrito","fisica.restituicao","fisica.bloqueio","fisica.aplicar_regras"
    ]);
  });
});
