import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M90 — sleep",()=>{it("converge sleep, wake, state and threshold",()=>{const p=parseOldRewrite("limiar repouso 0.02\ndormir fisica\nacordar fisica\nestado repouso");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.limiar_repouso","fisica.sleep","fisica.acordar","fisica.estado_repouso"]);});});
