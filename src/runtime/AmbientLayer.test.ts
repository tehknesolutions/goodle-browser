import {describe,expect,it} from "vitest";
import {createAmbientPlan,createCombatFxPlan} from "./AmbientLayer";
describe("AmbientLayer",()=>{it("creates distinct biome ambience",()=>{expect(createAmbientPlan("forest").motif).toBe("canopy");expect(createAmbientPlan("space").motif).toBe("stars");expect(createAmbientPlan("ice").particles).toBe("snow")});it("defines attack and impact feedback",()=>{expect(createCombatFxPlan("attack").duration).toBeGreaterThan(0);expect(createCombatFxPlan("impact").scale).toBeGreaterThan(1)})});
