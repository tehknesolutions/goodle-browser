import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M89 — persistent contacts",()=>{it("converge operações",()=>{const p=parseOldRewrite("contatos persistentes\nresolver contatos persistentes");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.contatos_persistentes","fisica.resolver_contatos_persistentes"]);});});
