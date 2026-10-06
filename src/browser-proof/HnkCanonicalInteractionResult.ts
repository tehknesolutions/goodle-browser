import {readHnkTargetEnvelope} from "./HnkTargetEnvelope";
const OUTER=["accepted","actor","interaction","interactionRevision","reason","targetEnvelope","targetId","worldRevision"];
const ACTOR=["id","x","y"],INTENT=["actorId","interaction","targetId"];
const exact=(v:object,keys:string[])=>{const actual=Object.keys(v).sort(),expected=[...keys].sort();return actual.length===expected.length&&actual.every((k,i)=>k===expected[i]);};
const invalid=():never=>{throw new Error("GOODLE_HNK_CANONICAL_INTERACTION_RESULT_INVALID");};
export function readHnkCanonicalInteractionResult(value:unknown){
 if(!value||typeof value!=="object"||Array.isArray(value)||!exact(value,OUTER))invalid();
 const r=value as Record<string,unknown>;
 if(r.accepted!==true||r.reason!=="entered"||typeof r.targetId!=="string"||!r.targetId)invalid();
 for(const key of ["interactionRevision","worldRevision"]){const n=r[key];if(typeof n!=="number"||!Number.isSafeInteger(n)||n<=0)invalid();}
 if(r.interactionRevision!==r.worldRevision)invalid();
 const actor=r.actor;if(!actor||typeof actor!=="object"||Array.isArray(actor)||!exact(actor,ACTOR))invalid();
 const a=actor as Record<string,unknown>;if(typeof a.id!=="string"||!a.id||typeof a.x!=="number"||!Number.isFinite(a.x)||typeof a.y!=="number"||!Number.isFinite(a.y))invalid();
 const intent=r.interaction;if(!intent||typeof intent!=="object"||Array.isArray(intent)||!exact(intent,INTENT))invalid();
 const i=intent as Record<string,unknown>;if(i.actorId!==a.id||i.interaction!=="enter"||i.targetId!==r.targetId)invalid();
 let envelope;try{envelope=readHnkTargetEnvelope(r.targetEnvelope);}catch{invalid();}
 if(envelope.revision!==r.worldRevision||envelope.snapshot.id!==r.targetId)invalid();
 return {accepted:true,reason:"entered",interaction:{actorId:i.actorId,interaction:"enter",targetId:i.targetId},actor:{id:a.id,x:a.x,y:a.y},targetId:r.targetId,interactionRevision:r.interactionRevision,worldRevision:r.worldRevision,targetEnvelope:{schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision:envelope.revision,snapshot:{...envelope.snapshot}}};
}
