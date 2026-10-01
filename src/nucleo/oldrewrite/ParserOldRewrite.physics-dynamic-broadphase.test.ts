import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M94 — dynamic broadphase",()=>{it("converge update, rebuild and state",()=>{const p=parseOldRewrite("atualizar broadphase\nreconstruir broadphase\nestado broadphase");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.broadphase_atualizar","fisica.broadphase_reconstruir","fisica.broadphase_estado"]);});});
