import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M97 — validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("manifold cache\nmanifold atualizar\nmanifold estado"))).toEqual([]);});});
