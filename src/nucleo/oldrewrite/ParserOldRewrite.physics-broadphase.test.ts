import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M92 — broadphase",()=>{it("converge operações",()=>{const p=parseOldRewrite("broadphase\nparticao espacial\ncandidatos colisao");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.broadphase","fisica.particao_espacial","fisica.candidatos_colisao"]);});});
