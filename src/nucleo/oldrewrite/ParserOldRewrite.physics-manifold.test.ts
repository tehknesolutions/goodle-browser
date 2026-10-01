import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M97 — manifold cache",()=>{it("converge cache, update and state",()=>{const p=parseOldRewrite("manifold cache\nmanifold atualizar\nmanifold estado");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.manifold_cache","fisica.manifold_atualizar","fisica.manifold_estado"]);});});
