import {describe,expect,it} from "vitest";
import {compileManifestationArtifact} from "./ManifestationArtifact";
describe("ManifestationArtifact",()=>{it("compiles an intention into a React/Phaser-ready artifact",()=>{const a=compileManifestationArtifact("Crie um jogo de plataforma");expect(a.kind).toBe("interactive-experience");expect(a.runtime).toBe("phaser");expect(a.framework).toBe("react");expect(a.title).toBe("Crie um jogo de plataforma");expect(a.scene.key).toBe("ManifestationScene");expect(a.scene.entities.length).toBeGreaterThan(0)})});
