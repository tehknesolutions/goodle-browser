import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M96 — validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("coerencia colisao\ninvalidar colisao\nestado colisao"))).toEqual([]);});});
