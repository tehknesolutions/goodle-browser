import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Phaser from "phaser";
import { createHakodanPortalVisualProof } from "./HakodanPortalBrowserProof";

type PortalProof = ReturnType<typeof createHakodanPortalVisualProof>;
type BrowserProof = {
  schema: "goodle.browser-runtime-proof.v1";
  react: { mounted: boolean; text: string; runtime: "react@19" };
  phaser: { booted: boolean; canvas_present: boolean; scene_key: string; width: number; height: number; runtime: "phaser@3" };
  hakodan: { portal: PortalProof };
};

declare global { interface Window { __GOODLE_BROWSER_PROOF__?: BrowserProof } }

function ReactProof() {
  return <article data-goodle-browser-proof="react" data-runtime="react@19" data-mounted="true">Goodle React Browser Runtime Proof</article>;
}

const reactHost=document.getElementById("goodle-react-proof");
if(!reactHost) throw new Error("GOODLE_REACT_PROOF_HOST_MISSING");
createRoot(reactHost).render(<StrictMode><ReactProof /></StrictMode>);

const sceneKey="GoodleBrowserProofScene";
const canonicalPortal={id:"portal-1",state:"open" as const};
const portalProof=createHakodanPortalVisualProof(canonicalPortal);

class GoodleBrowserProofScene extends Phaser.Scene {
  constructor(){super(sceneKey);}
  create(){
    this.registry.set("goodle.browser.proof",true);
    this.registry.set("goodle.runtime","phaser@3");
    this.registry.set("hakodan.portal.proof",portalProof);
    this.add.text(12,12,"Goodle Phaser Browser Runtime Proof");
    const cx=160,cy=100;
    if(portalProof.visualState==="open"){
      this.add.circle(cx,cy,30,0x00ffff,0.18).setStrokeStyle(4,0x00ffff,1);
      this.add.circle(cx,cy,18,0x66ffff,0.25).setStrokeStyle(2,0xffffff,0.9);
      this.add.text(cx-34,cy+38,"PORTAL OPEN",{fontSize:"12px"});
    } else {
      this.add.circle(cx,cy,30,0x333333,0.8).setStrokeStyle(4,0x777777,1);
      this.add.line(cx,cy,0,-22,0,22,0x999999,1).setLineWidth(3);
      this.add.text(cx-42,cy+38,"PORTAL CLOSED",{fontSize:"12px"});
    }
  }
}

const game=new Phaser.Game({type:Phaser.CANVAS,width:320,height:180,parent:"goodle-phaser-root",backgroundColor:"#111111",scene:[GoodleBrowserProofScene],banner:false});

function publishProof(){
  const reactNode=document.querySelector<HTMLElement>('[data-goodle-browser-proof="react"]');
  const canvas=document.querySelector<HTMLCanvasElement>("#goodle-phaser-root canvas");
  const scene=game.scene.getScene(sceneKey);
  if(!reactNode||!canvas||!scene?.sys?.isActive()){window.requestAnimationFrame(publishProof);return;}
  window.__GOODLE_BROWSER_PROOF__={
    schema:"goodle.browser-runtime-proof.v1",
    react:{mounted:reactNode.dataset.mounted==="true",text:reactNode.textContent??"",runtime:"react@19"},
    phaser:{booted:scene.registry.get("goodle.browser.proof")===true,canvas_present:true,scene_key:sceneKey,width:canvas.width,height:canvas.height,runtime:"phaser@3"},
    hakodan:{portal:scene.registry.get("hakodan.portal.proof") as PortalProof},
  };
}
window.requestAnimationFrame(publishProof);
