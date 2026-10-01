import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M95 — pair cache",()=>{it("converge cache, update and state",()=>{const p=parseOldRewrite("cache pares broadphase\natualizar pares broadphase\nestado pares broadphase");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.broadphase_pares_cache","fisica.broadphase_pares_atualizar","fisica.broadphase_pares_estado"]);});});
