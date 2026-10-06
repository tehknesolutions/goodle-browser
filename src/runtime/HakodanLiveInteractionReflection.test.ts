import {describe,expect,it} from "vitest";
import {createHakodanLiveInteractionReflection} from "./HakodanLiveInteractionReflection";
const r=(revision:number,x=3)=>({accepted:true,reason:"entered",interaction:{actorId:"alakazam",interaction:"enter",targetId:"portal-1"},actor:{id:"alakazam",x,y:0},targetId:"portal-1",interactionRevision:revision,worldRevision:revision,targetEnvelope:{schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision,snapshot:{id:"portal-1",state:"open"}}});
describe("live interaction reflection",()=>{
 it("orders newer interaction results",()=>{const live=createHakodanLiveInteractionReflection();expect(live.deliver(r(4)).disposition).toBe("created");expect(live.deliver(r(5,4)).disposition).toBe("updated");});
 it("classifies duplicate conflict and stale",()=>{const live=createHakodanLiveInteractionReflection();live.deliver(r(5,4));expect(live.deliver(r(5,4)).disposition).toBe("duplicate");expect(live.deliver(r(5,3)).disposition).toBe("conflict");expect(live.deliver(r(4,3)).disposition).toBe("stale");});
});
