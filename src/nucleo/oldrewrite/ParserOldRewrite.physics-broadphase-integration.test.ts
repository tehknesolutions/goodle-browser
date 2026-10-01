import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M93 — broadphase integration",()=>{it("converge toggles and pair query",()=>{const p=parseOldRewrite("ativar broadphase\npares colisao\ndesativar broadphase");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.broadphase_ativar","fisica.pares_colisao","fisica.broadphase_desativar"]);});});
