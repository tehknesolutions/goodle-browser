import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M99 — solver state",()=>{it("converge solver operations",()=>{const p=parseOldRewrite("solver estado\nsolver iterar\nsolver aplicar");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.solver.estado","fisica.solver.iterar","fisica.solver.aplicar"]);});});
