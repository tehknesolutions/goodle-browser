import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M98 — warm start",()=>{it("converge warm start operations",()=>{const p=parseOldRewrite("warm start\naplicar warm start\nestado warm start");expect(p.nos.map(n=>n.semantica)).toEqual(["fisica.warm_start","fisica.warm_start_aplicar","fisica.warm_start_estado"]);});});
