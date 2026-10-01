import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M95 — validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("cache pares broadphase\natualizar pares broadphase\nestado pares broadphase"))).toEqual([]);});});
