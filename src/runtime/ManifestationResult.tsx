import {PhaserManifestation} from "./PhaserManifestation";
import type {ManifestationArtifact} from "./ManifestationArtifact";
export function ManifestationResult({artifact}:{artifact:ManifestationArtifact}){return <section className="manifestation-runtime-mount"><div className="manifestation-runtime-meta"><strong>{artifact.title}</strong><span>React + Phaser</span></div><PhaserManifestation artifact={artifact}/></section>}
