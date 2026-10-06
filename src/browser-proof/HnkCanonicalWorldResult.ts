import {readHnkTargetEnvelope} from "./HnkTargetEnvelope";
const OUTER=["actor","targetEnvelope","worldRevision"],ACTOR=["id","x","y"];
const exact=(value:object,expected:string[])=>{const keys=Object.keys(value).sort();return keys.length===expected.length&&keys.every((key,index)=>key===expected[index]);};
const invalid=():never=>{throw new Error("GOODLE_HNK_CANONICAL_WORLD_RESULT_INVALID");};
export function readHnkCanonicalWorldResult(value:unknown){
 if(!value||typeof value!=="object"||Array.isArray(value)||!exact(value,OUTER))invalid();const record=value as Record<string,unknown>;
 const revision=record.worldRevision;if(typeof revision!=="number"||!Number.isSafeInteger(revision)||revision<=0)invalid();
 const actor=record.actor;if(!actor||typeof actor!=="object"||Array.isArray(actor)||!exact(actor,ACTOR))invalid();const a=actor as Record<string,unknown>;
 if(typeof a.id!=="string"||!a.id||typeof a.x!=="number"||!Number.isFinite(a.x)||typeof a.y!=="number"||!Number.isFinite(a.y))invalid();
 let parsed;try{parsed=readHnkTargetEnvelope(record.targetEnvelope);}catch{invalid();}if(parsed.revision!==revision)invalid();
 return {worldRevision:revision,actor:{id:a.id,x:a.x,y:a.y},targetEnvelope:{schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision:parsed.revision,snapshot:{...parsed.snapshot}}};
}
