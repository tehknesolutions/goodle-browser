import {describe,expect,it} from "vitest";
import {compileManifestationArtifact} from "./ManifestationArtifact";
describe("intent-sensitive manifestation",()=>{
 it("creates platformer behavior from platform intent",()=>{const a=compileManifestationArtifact("Crie um jogo de plataforma com inimigos");expect(a.experience).toBe("platformer");expect(a.scene.entities.some(e=>e.kind==="enemy")).toBe(true);expect(a.controls.jump).toBe(true)});
 it("creates top-down behavior from adventure intent",()=>{const a=compileManifestationArtifact("Crie uma aventura top down com inimigos");expect(a.experience).toBe("top-down");expect(a.controls.jump).toBe(false);expect(a.controls.vertical).toBe(true)});
 it("creates sandbox behavior for generic creation",()=>{const a=compileManifestationArtifact("Crie um mundo interativo");expect(a.experience).toBe("sandbox");expect(a.scene.entities.some(e=>e.kind==="object")).toBe(true)});
});
