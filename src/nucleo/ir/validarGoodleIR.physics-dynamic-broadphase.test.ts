import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M94 — validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("atualizar broadphase\nreconstruir broadphase\nestado broadphase"))).toEqual([]);});});
