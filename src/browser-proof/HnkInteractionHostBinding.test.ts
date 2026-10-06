import {describe,expect,it} from "vitest";
import type {InteractionIntent} from "./HnkInteractionInput";

function assertHostBinding(intent:InteractionIntent,raw:any){
 if(raw?.interaction?.actorId!==intent.actorId||raw?.interaction?.interaction!==intent.interaction||raw?.interaction?.targetId!==intent.targetId)throw new Error("GOODLE_HNK_CANONICAL_INTERACTION_HOST_MISMATCH");
 return raw;
}
describe("interaction host binding",()=>{
 const intent={actorId:"alakazam",interaction:"enter",targetId:"portal-1"} as const;
 it("accepts the exact submitted interaction",()=>expect(assertHostBinding(intent,{interaction:intent})).toBeTruthy());
 it("rejects a self-consistent response for another target",()=>expect(()=>assertHostBinding(intent,{interaction:{actorId:"alakazam",interaction:"enter",targetId:"portal-2"}})).toThrow("GOODLE_HNK_CANONICAL_INTERACTION_HOST_MISMATCH"));
 it("rejects a response for another actor",()=>expect(()=>assertHostBinding(intent,{interaction:{actorId:"abra",interaction:"enter",targetId:"portal-1"}})).toThrow("GOODLE_HNK_CANONICAL_INTERACTION_HOST_MISMATCH"));
});
