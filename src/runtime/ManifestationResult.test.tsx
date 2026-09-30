import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {ManifestationResult} from "./ManifestationResult";
import {compileManifestationArtifact} from "./ManifestationArtifact";
describe("ManifestationResult",()=>{it("shows executable artifact metadata and mount surface",()=>{const artifact=compileManifestationArtifact("Crie um jogo");const html=renderToStaticMarkup(<ManifestationResult artifact={artifact}/>);expect(html).toContain("Crie um jogo");expect(html).toContain("React + Phaser");expect(html).toContain("manifestation-runtime-mount")})});
