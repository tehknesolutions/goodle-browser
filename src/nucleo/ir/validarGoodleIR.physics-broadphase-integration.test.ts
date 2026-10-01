import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M93 — validation",()=>{it("aceita integração",()=>expect(validarGoodleIR(parseOldRewrite("ativar broadphase\npares colisao\ndesativar broadphase"))).toEqual([]);});});
