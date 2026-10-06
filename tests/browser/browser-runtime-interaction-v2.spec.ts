import {expect,test} from "@playwright/test";
import type {BrowserRuntimeObservationV1} from "../../src/nucleo/lineage/BrowserRuntimeProof";

test("V2-32 Enter submits canonical portal entry and manifests accepted result",async({page})=>{
 await page.addInitScript(()=>{
  (window as Window & {__HNK_CANONICAL_INTERACTION_HOST__?:(intent:unknown)=>unknown}).__HNK_CANONICAL_INTERACTION_HOST__=(intent:any)=>({
   accepted:true,reason:"entered",interaction:intent,actor:{id:"alakazam",x:3,y:0},targetId:"portal-1",
   interactionRevision:4,worldRevision:4,
   targetEnvelope:{schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision:4,snapshot:{id:"portal-1",state:"open"}}
  });
 });
 await page.goto("/browser-proof.html");
 await page.waitForSelector("#goodle-phaser-root canvas");
 await page.keyboard.press("Enter");
 await page.waitForFunction(()=>Boolean((window as Window & {__GOODLE_BROWSER_PROOF__?:unknown}).__GOODLE_BROWSER_PROOF__?.["hakodan"]?.["interaction"]));
 const observation=await page.evaluate(()=> (window as Window & {__GOODLE_BROWSER_PROOF__?:BrowserRuntimeObservationV1}).__GOODLE_BROWSER_PROOF__);
 expect(observation?.hakodan.interaction).toMatchObject({accepted:true,rendered:true,interactionRevision:4});
 expect(observation?.hakodan.interaction?.world).toBeTruthy();
});
