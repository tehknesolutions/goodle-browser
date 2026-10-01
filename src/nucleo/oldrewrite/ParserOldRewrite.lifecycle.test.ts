import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";

describe("M76 — lifecycle events", () => {
  it("converge PT-BR e inglês para iniciar/atualizar", () => {
    const programa = parseOldRewrite(`quando iniciar:
  aumentar vida de heroi em 10
quando atualizar:
  se vida de heroi maior que 100:
    definir vida de heroi como 100`);
    expect(programa.nos[0].parametros?.evento).toBe("evento.iniciar");
    expect(programa.nos[1].parametros?.evento).toBe("evento.atualizar");

    const ingles = parseOldRewrite(`when start:
  increase life of hero by 10
when update:
  if life of hero greater than 100:
    set life of hero to 100`);
    expect(ingles.nos[0].parametros?.evento).toBe("evento.iniciar");
    expect(ingles.nos[1].parametros?.evento).toBe("evento.atualizar");
  });
});
