import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M90 — validation",()=>{it("aceita threshold válido",()=>expect(validarGoodleIR(parseOldRewrite("limiar repouso 0.02"))).toEqual([]);});});
