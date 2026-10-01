import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M98 — validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("warm start\naplicar warm start\nestado warm start"))).toEqual([]);});});
