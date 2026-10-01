import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M91 — wake and islands",()=>{it("converge operações",()=>{const p=parseOldRewrite("evento acordar\nilhas\nativar ilha\nestado ilhas");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.evento_acordar","fisica.ilhas","fisica.ativar_ilha","fisica.estado_ilhas"]);});});
