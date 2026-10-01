import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M80 — entity state", () => {
  it("converge activate/deactivate/spawn/despawn", () => {
    const programa = parseOldRewrite(`ativar heroi
desativar heroi
spawn inimigo
despawn inimigo`);
    expect(programa.nos.map((n) => n.semantica)).toEqual([
      "entidade.ativar", "entidade.desativar", "entidade.spawn", "entidade.despawn"
    ]);
  });
});
