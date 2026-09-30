import {describe,expect,it} from "vitest";
import {compileManifestationArtifact} from "./ManifestationArtifact";
import {createRuntimeBehaviorPlan} from "./RuntimeBehaviorPlan";
describe("runtime behavior plan",()=>{it("activates enemies, solid obstacles, camera and portal goal",()=>{const p=createRuntimeBehaviorPlan(compileManifestationArtifact("Crie um RPG top-down com 3 inimigos, 2 obstáculos e objetivo de chegar ao portal"));expect(p.enemyPatrol).toBe(true);expect(p.solidObstacles).toBe(true);expect(p.cameraFollow).toBe(true);expect(p.portalCompletesObjective).toBe(true);expect(p.objectiveLabel).toContain("portal")})});
