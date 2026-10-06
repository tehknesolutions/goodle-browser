import {describe,expect,it} from "vitest";
import {readHnkCanonicalInteractionResult} from "./HnkCanonicalInteractionResult";
const accepted={accepted:true,reason:"entered",interaction:{actorId:"alakazam",interaction:"enter",targetId:"portal-1"},actor:{id:"alakazam",x:3,y:0},targetId:"portal-1",interactionRevision:4,worldRevision:4,targetEnvelope:{schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision:4,snapshot:{id:"portal-1",state:"open"}}};
describe("canonical interaction result",()=>{
 it("accepts exact aligned result",()=>expect(readHnkCanonicalInteractionResult(accepted)).toEqual(accepted));
 it("rejects envelope target mismatch",()=>expect(()=>readHnkCanonicalInteractionResult({...accepted,targetEnvelope:{...accepted.targetEnvelope,snapshot:{id:"portal-2",state:"open"}}})).toThrow("GOODLE_HNK_CANONICAL_INTERACTION_RESULT_INVALID"));
 it("rejects revision mismatch, extras and malformed interaction",()=>{for(const bad of [{...accepted,worldRevision:3},{...accepted,extra:true},{...accepted,interactionRevision:5},{...accepted,interaction:{...accepted.interaction,interaction:"exit"}}])expect(()=>readHnkCanonicalInteractionResult(bad)).toThrow("GOODLE_HNK_CANONICAL_INTERACTION_RESULT_INVALID");});
 it("rejects accessor-bearing extra without evaluating it",()=>{let touched=0;const value:any={...accepted};Object.defineProperty(value,"callback",{enumerable:true,get(){touched++;throw new Error("EXECUTED");}});expect(()=>readHnkCanonicalInteractionResult(value)).toThrow("GOODLE_HNK_CANONICAL_INTERACTION_RESULT_INVALID");expect(touched).toBe(0);});
});
