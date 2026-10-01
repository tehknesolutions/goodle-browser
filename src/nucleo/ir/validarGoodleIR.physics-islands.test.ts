import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M91 — validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("evento acordar\nilhas\nativar ilha\nestado ilhas"))).toEqual([]);});});
