import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M99 — validation",()=>{it("aceita solver operations",()=>expect(validarGoodleIR(parseOldRewrite("solver estado\nsolver iterar\nsolver aplicar"))).toEqual([]);});});
