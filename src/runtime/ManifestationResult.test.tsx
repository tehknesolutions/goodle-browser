import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
vi.mock("./PhaserManifestation",()=>({PhaserManifestation:()=>null}));
import {ManifestationResult} from "./ManifestationResult";
import {compileManifestationArtifact} from "./ManifestationArtifact";
describe("ManifestationResult",()=>{it("shows executable artifact metadata and mount surface",()=>{const artifact=compileManifestationArtifact("Crie um jogo");const html=renderToStaticMarkup(<ManifestationResult artifact={artifact}/>);expect(html).toContain("Crie um jogo");expect(html).toContain("React + Phaser");expect(html).toContain("manifestation-runtime-mount")})});
