import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import Phaser from "phaser";
import {createHnkLiveTargetDelivery} from "./HnkLiveTargetDelivery";

type PortalHandle={ring:Phaser.GameObjects.Arc;core:Phaser.GameObjects.Arc;label:Phaser.GameObjects.Text};
type PortalEvidence=ReturnType<ReturnType<typeof createHnkLiveTargetDelivery<PortalHandle>>["deliver"]>;
type BrowserProof={schema:"goodle.browser-runtime-proof.v1";react:{mounted:boolean;text:string;runtime:"react@19"};phaser:{booted:boolean;canvas_present:boolean;scene_key:string;width:number;height:number;runtime:"phaser@3"};hakodan:{portal:PortalEvidence}};

declare global{interface Window{__GOODLE_BROWSER_PROOF__?:BrowserProof;__HNK_TARGET_ENVELOPE__?:unknown;__HNK_DELIVER_TARGET_ENVELOPE__?:(value:unknown)=>PortalEvidence;}}
function ReactProof(){return <article data-goodle-browser-proof="react" data-runtime="react@19" data-mounted="true">Goodle React Browser Runtime Proof</article>;}
const reactHost=document.getElementById("goodle-react-proof");if(!reactHost)throw new Error("GOODLE_REACT_PROOF_HOST_MISSING");createRoot(reactHost).render(<StrictMode><ReactProof/></StrictMode>);
const sceneKey="GoodleBrowserProofScene";

class GoodleBrowserProofScene extends Phaser.Scene{
 constructor(){super(sceneKey);}
 create(){
  this.registry.set("goodle.browser.proof",true);this.registry.set("goodle.runtime","phaser@3");this.add.text(12,12,"Goodle Phaser Browser Runtime Proof");
  const delivery=createHnkLiveTargetDelivery<PortalHandle>({
   create:(_id,state)=>{const cx=160,cy=100;const ring=this.add.circle(cx,cy,30);const core=this.add.circle(cx,cy,18);const label=this.add.text(cx-42,cy+38,"");const handle={ring,core,label};applyPortalVisual(handle,state);return handle;},
   update:(handle,state)=>applyPortalVisual(handle,state)
  });
  const deliver=(value:unknown)=>{const evidence=delivery.deliver(value);this.registry.set("hakodan.portal.proof",evidence);publishProof();return evidence;};
  window.__HNK_DELIVER_TARGET_ENVELOPE__=deliver;
  deliver(window.__HNK_TARGET_ENVELOPE__);
 }
}
function applyPortalVisual(handle:PortalHandle,state:"closed"|"open"){
 if(state==="open"){handle.ring.setFillStyle(0x00ffff,0.18).setStrokeStyle(4,0x00ffff,1);handle.core.setFillStyle(0x66ffff,0.25).setStrokeStyle(2,0xffffff,0.9);handle.label.setText("PORTAL OPEN");}
 else{handle.ring.setFillStyle(0x333333,0.8).setStrokeStyle(4,0x777777,1);handle.core.setFillStyle(0x222222,0.8).setStrokeStyle(2,0x999999,1);handle.label.setText("PORTAL CLOSED");}
}
const game=new Phaser.Game({type:Phaser.CANVAS,width:320,height:180,parent:"goodle-phaser-root",backgroundColor:"#111111",scene:[GoodleBrowserProofScene],banner:false});
function publishProof(){
 const reactNode=document.querySelector<HTMLElement>('[data-goodle-browser-proof="react"]');const canvas=document.querySelector<HTMLCanvasElement>("#goodle-phaser-root canvas");const scene=game.scene.getScene(sceneKey);const portal=scene?.registry?.get("hakodan.portal.proof") as PortalEvidence|undefined;
 if(!reactNode||!canvas||!scene?.sys?.isActive()||!portal?.rendered)return;
 window.__GOODLE_BROWSER_PROOF__={schema:"goodle.browser-runtime-proof.v1",react:{mounted:reactNode.dataset.mounted==="true",text:reactNode.textContent??"",runtime:"react@19"},phaser:{booted:scene.registry.get("goodle.browser.proof")===true,canvas_present:true,scene_key:sceneKey,width:canvas.width,height:canvas.height,runtime:"phaser@3"},hakodan:{portal}};
}
