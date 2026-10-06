import type { ClosedLoopTrustProofV1 } from "./ClosedLoopTrustProof";
import { sha256Json } from "./BuildLedger";

export type BrowserRuntimeObservationV1 = {
  schema: "goodle.browser-runtime-proof.v1";
  react: { mounted: boolean; text: string; runtime: "react@19" };
  phaser: { booted: boolean; canvas_present: boolean; scene_key: string; width: number; height: number; runtime: "phaser@3" };
  hakodan: {
    interaction?: {
      accepted: boolean;
      rendered: boolean;
      interactionRevision?: number;
      disposition?: "created" | "updated" | "duplicate" | "stale" | "conflict";
      world?: unknown;
    };
    portal: {
      id: string;
      receivedRevision: number;
      acceptedRevision: number;
      renderedRevision: number;
      canonicalState: "closed" | "open";
      visualState: "closed" | "open";
      manifestation: "portal-closed" | "portal-open";
      rendered: true;
      disposition: "created" | "updated" | "duplicate" | "stale" | "conflict";
      accepted: boolean;
    };
  };
};

export type BrowserRuntimeEvidenceProofV1 = {schema:"goodle.browser-runtime-evidence-proof.v1";proof_id:string;closed_loop_proof_id:string;closed_loop_hash:string;bundle_id:string;execution_id:string;browser_engine:"chromium";react_dom_mounted:true;phaser_canvas_booted:true;phaser_scene_key:string;canvas_width:number;canvas_height:number;observation_hash:string;proof_hash:string};
export function createBrowserRuntimeEvidenceProof(input:{observation:BrowserRuntimeObservationV1;closed_loop:Pick<ClosedLoopTrustProofV1,"proof_id"|"closed_loop_hash"|"bundle_id"|"execution_id">}):BrowserRuntimeEvidenceProofV1{if(!input.observation.react.mounted)throw new Error("BROWSER_RUNTIME_REACT_DOM_NOT_MOUNTED");if(!input.observation.phaser.booted||!input.observation.phaser.canvas_present)throw new Error("BROWSER_RUNTIME_PHASER_CANVAS_NOT_BOOTED");if(input.observation.phaser.width<=0||input.observation.phaser.height<=0)throw new Error("BROWSER_RUNTIME_INVALID_CANVAS_DIMENSIONS");const observation_hash=sha256Json(input.observation);const unsigned={schema:"goodle.browser-runtime-evidence-proof.v1" as const,closed_loop_proof_id:input.closed_loop.proof_id,closed_loop_hash:input.closed_loop.closed_loop_hash,bundle_id:input.closed_loop.bundle_id,execution_id:input.closed_loop.execution_id,browser_engine:"chromium" as const,react_dom_mounted:true as const,phaser_canvas_booted:true as const,phaser_scene_key:input.observation.phaser.scene_key,canvas_width:input.observation.phaser.width,canvas_height:input.observation.phaser.height,observation_hash};const proof_hash=sha256Json(unsigned);return{...unsigned,proof_id:`browser-runtime-${proof_hash.slice(0,16)}`,proof_hash};}
export function verifyBrowserRuntimeEvidenceProof(proof:BrowserRuntimeEvidenceProofV1,observation:BrowserRuntimeObservationV1):boolean{const{proof_id:_proofId,proof_hash,...unsigned}=proof;return proof.observation_hash===sha256Json(observation)&&proof.react_dom_mounted===observation.react.mounted&&proof.phaser_canvas_booted===(observation.phaser.booted&&observation.phaser.canvas_present)&&proof.phaser_scene_key===observation.phaser.scene_key&&proof.canvas_width===observation.phaser.width&&proof.canvas_height===observation.phaser.height&&sha256Json(unsigned)===proof_hash;}
