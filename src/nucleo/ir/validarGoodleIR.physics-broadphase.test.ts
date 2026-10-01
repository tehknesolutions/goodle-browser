import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M92 — validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("broadphase\nparticao espacial\ncandidatos colisao"))).toEqual([]);});});
