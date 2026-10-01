import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "../oldrewrite/ParserOldRewrite";
import { validarGoodleIR } from "./validarGoodleIR";
describe("M88 — contact validation",()=>{it("aceita operações",()=>expect(validarGoodleIR(parseOldRewrite("contatos\ncolisao continua\nresolver contatos"))).toEqual([]));});
