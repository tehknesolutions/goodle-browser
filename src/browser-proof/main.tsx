import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import Phaser from "phaser";
import {createHnkLiveTargetDelivery} from "./HnkLiveTargetDelivery";
import {createHnkCanonicalWorldDelivery} from "./HnkCanonicalWorldDelivery";
import {movementIntentForKey,type MovementIntent} from "./HnkMovementInput";
import {interactionIntentForKey,type InteractionIntent} from "./HnkInteractionInput";
import {createHnkCanonicalInteractionDelivery} from "./HnkCanonicalInteractionDelivery";

type PortalHandle={ring:Phaser.GameObjects.Arc;core:Phaser.GameObjects.Arc;label:Phaser.GameObjects.Text};
type ActorHandle={body:Phaser.GameObjects.Arc;label:Phaser.GameObjects.Text};
type PortalEvidence=ReturnType<ReturnType<typeof createHnkLiveTargetDelivery<PortalHandle>>["deliver"]>;
type WorldEvidence=ReturnType<ReturnType<typeof createHnkCanonicalWorldDelivery<ActorHandle>>["deliver"]>;
type InteractionEvidence={accepted:boolean;rendered:boolean;interactionRevision?:number;disposition?:string;world?:unknown};
type BrowserProof={schema:"goodle.browser-runtime-proof.v1";react:{mounted:boolean;text:string;runtime:"react@19"};phaser:{booted:boolean;canvas_present:boolean;scene_key:string;width:number;height:number;runtime:"phaser@3"};hakodan:{portal?:PortalEvidence;world?:WorldEvidence;interaction?:InteractionEvidence}};

declare global{interface Window{__GOODLE_BROWSER_PROOF__?:BrowserProof;__HNK_TARGET_ENVELOPE__?:unknown;__HNK_DELIVER_TARGET_ENVELOPE__?:(value:unknown)=>PortalEvidence;__HNK_CANONICAL_MOVEMENT_HOST__?:(intent:MovementIntent)=>unknown;__HNK_SUBMIT_MOVEMENT_INTENT__?:(intent:MovementIntent)=>WorldEvidence;__HNK_CANONICAL_INTERACTION_HOST__?:(intent:InteractionIntent)=>unknown;__HNK_SUBMIT_INTERACTION_INTENT__?:(intent:InteractionIntent)=>InteractionEvidence;}}
function ReactProof(){return <article data-goodle-browser-proof="react" data-runtime="react@19" data-mounted="true">Goodle React Browser Runtime Proof</article>;}
const reactHost=document.getElementById("goodle-react-proof");if(!reactHost)throw new Error("GOODLE_REACT_PROOF_HOST_MISSING");createRoot(reactHost).render(<StrictMode><ReactProof/></StrictMode>);
const sceneKey="GoodleBrowserProofScene";
class GoodleBrowserProofScene extends Phaser.Scene{
 constructor(){super(sceneKey);}
 create(){
  this.registry.set("goodle.browser.proof",true);this.registry.set("goodle.runtime","phaser@3");this.add.text(12,12,"Goodle Phaser Browser Runtime Proof");
  const targetDelivery=createHnkLiveTargetDelivery<PortalHandle>({create:(_id,state)=>{const cx=240,cy=90,ring=this.add.circle(cx,cy,30),core=this.add.circle(cx,cy,18),label=this.add.text(cx-42,cy+38,"");const handle={ring,core,label};applyPortalVisual(handle,state);return handle;},update:applyPortalVisual});
  const worldDelivery=createHnkCanonicalWorldDelivery<ActorHandle>({actorDrawing:{create:(id,x,y)=>{const body=this.add.circle(actorScreenX(x),actorScreenY(y),14);const label=this.add.text(actorScreenX(x)-28,actorScreenY(y)+20,id);return{body,label};},update:(handle,x,y)=>{handle.body.setPosition(actorScreenX(x),actorScreenY(y));handle.label.setPosition(actorScreenX(x)-28,actorScreenY(y)+20);}},targetDelivery});
  const deliverTarget=(value:unknown)=>{const evidence=targetDelivery.deliver(value);this.registry.set("hakodan.portal.proof",evidence);publishProof();return evidence;};window.__HNK_DELIVER_TARGET_ENVELOPE__=deliverTarget;
  const interactionDelivery=createHnkCanonicalInteractionDelivery({worldDelivery});
  const submitInteraction=(intent:InteractionIntent)=>{const host=window.__HNK_CANONICAL_INTERACTION_HOST__;if(!host)throw new Error("GOODLE_HNK_CANONICAL_INTERACTION_HOST_MISSING");const submitted={actorId:intent.actorId,interaction:intent.interaction,targetId:intent.targetId} as const;const raw=host(Object.freeze({...submitted})) as any;if(raw?.interaction?.actorId!==submitted.actorId||raw?.interaction?.interaction!==submitted.interaction||raw?.interaction?.targetId!==submitted.targetId)throw new Error("GOODLE_HNK_CANONICAL_INTERACTION_HOST_MISMATCH");const evidence=interactionDelivery.deliver(raw);this.registry.set("hakodan.interaction.proof",evidence);this.registry.set("hakodan.world.proof",evidence.world);if(evidence.rendered&&evidence.world?.portal?.rendered)this.registry.set("hakodan.portal.proof",evidence.world.portal);publishProof();return evidence;};window.__HNK_SUBMIT_INTERACTION_INTENT__=submitInteraction;
  const submit=(intent:MovementIntent)=>{const host=window.__HNK_CANONICAL_MOVEMENT_HOST__;if(!host)throw new Error("GOODLE_HNK_CANONICAL_HOST_MISSING");const evidence=worldDelivery.deliver(host(intent));this.registry.set("hakodan.world.proof",evidence);this.registry.set("hakodan.portal.proof",evidence.portal);publishProof();return evidence;};window.__HNK_SUBMIT_MOVEMENT_INTENT__=submit;
  this.input.keyboard?.on("keydown",(event:KeyboardEvent)=>{const movement=movementIntentForKey(event.key);if(movement){submit(movement);return;}const interaction=interactionIntentForKey(event.key);if(interaction)submitInteraction(interaction);});
  if(window.__HNK_TARGET_ENVELOPE__)deliverTarget(window.__HNK_TARGET_ENVELOPE__);
 }
}
const actorScreenX=(x:number)=>40+x*32,actorScreenY=(y:number)=>90+y*32;
function applyPortalVisual(handle:PortalHandle,state:"closed"|"open"){if(state==="open"){handle.ring.setFillStyle(0x00ffff,0.18).setStrokeStyle(4,0x00ffff,1);handle.core.setFillStyle(0x66ffff,0.25).setStrokeStyle(2,0xffffff,0.9);handle.label.setText("PORTAL OPEN");}else{handle.ring.setFillStyle(0x333333,0.8).setStrokeStyle(4,0x777777,1);handle.core.setFillStyle(0x222222,0.8).setStrokeStyle(2,0x999999,1);handle.label.setText("PORTAL CLOSED");}}
const game=new Phaser.Game({type:Phaser.CANVAS,width:320,height:180,parent:"goodle-phaser-root",backgroundColor:"#111111",scene:[GoodleBrowserProofScene],banner:false});
function publishProof(){const reactNode=document.querySelector<HTMLElement>('[data-goodle-browser-proof="react"]'),canvas=document.querySelector<HTMLCanvasElement>("#goodle-phaser-root canvas"),scene=game.scene.getScene(sceneKey);if(!reactNode||!canvas||!scene?.sys?.isActive())return;const portal=scene.registry.get("hakodan.portal.proof") as PortalEvidence|undefined,world=scene.registry.get("hakodan.world.proof") as WorldEvidence|undefined,interaction=scene.registry.get("hakodan.interaction.proof") as InteractionEvidence|undefined;if(!portal?.rendered&&!world?.actor?.rendered&&!interaction?.rendered)return;window.__GOODLE_BROWSER_PROOF__={schema:"goodle.browser-runtime-proof.v1",react:{mounted:reactNode.dataset.mounted==="true",text:reactNode.textContent??"",runtime:"react@19"},phaser:{booted:scene.registry.get("goodle.browser.proof")===true,canvas_present:true,scene_key:sceneKey,width:canvas.width,height:canvas.height,runtime:"phaser@3"},hakodan:{portal,world,...(interaction?{interaction}: {})}};}
