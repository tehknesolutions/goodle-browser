import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M96 — collision coherence",()=>{it("converge coherence, invalidation and state",()=>{const p=parseOldRewrite("coerencia colisao\ninvalidar colisao\nestado colisao");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.coerencia_colisao","fisica.invalidar_colisao","fisica.estado_colisao"]);});});
