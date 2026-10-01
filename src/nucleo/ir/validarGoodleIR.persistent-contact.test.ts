import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M89 — validation",()=>{it("aceita operações persistentes",()=>expect(validarGoodleIR(parseOldRewrite("contatos persistentes\nresolver contatos persistentes"))).toEqual([]);});});
