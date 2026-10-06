import {readHnkCanonicalInteractionResult} from "./HnkCanonicalInteractionResult";
import {createHakodanLiveInteractionReflection} from "../runtime/HakodanLiveInteractionReflection";
export function createHnkCanonicalInteractionDelivery(deps:{worldDelivery:{deliver:(value:unknown)=>unknown};targetDelivery?:{deliver:(value:unknown)=>unknown}}){
 const ordering=createHakodanLiveInteractionReflection();
 return {deliver(value:unknown){
  const parsed=readHnkCanonicalInteractionResult(value);
  const ordered=ordering.deliver(parsed);
  if(!ordered.accepted)return {...ordered,rendered:false,world:undefined};
  const world=deps.worldDelivery.deliver({worldRevision:parsed.worldRevision,actor:parsed.actor,targetEnvelope:parsed.targetEnvelope});
  const portalSatisfied=Boolean((world as any)?.portal?.rendered||(world as any)?.portal?.disposition==="duplicate");const actorSatisfied=Boolean((world as any)?.actor?.rendered||(world as any)?.actor?.disposition==="duplicate");const rendered=Boolean(actorSatisfied&&portalSatisfied);
  return {...ordered,world,rendered};
 }};
}
