import {describe,expect,it} from "vitest";
import {proceduralVisualPlan} from "./ProceduralGraphics";
describe("procedural graphics",()=>{it("builds layered visuals for hero enemy portal and biome props",()=>{expect(proceduralVisualPlan("player","forest").layers.length).toBeGreaterThan(2);expect(proceduralVisualPlan("enemy","forest").animation).toBe("pulse");expect(proceduralVisualPlan("portal","space").particles).toBe(true);expect(proceduralVisualPlan("object","ice").layers.some(l=>l.shape==="diamond")).toBe(true)})});
