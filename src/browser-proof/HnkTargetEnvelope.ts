import { readHakodanPortalInput } from "./HakodanPortalInput";
import type { HakodanPortalSnapshot } from "../runtime/HakodanPortalReflection";

const ENVELOPE_KEYS=["kind","revision","schema","snapshot","target"];
const SNAPSHOT_KEYS=["id","state"];
function exactKeys(value:object,expected:string[]){const keys=Object.keys(value).sort();return keys.length===expected.length&&keys.every((key,index)=>key===expected[index]);}
function invalid():never{throw new Error("GOODLE_HNK_TARGET_ENVELOPE_INVALID");}

export type HnkTargetEnvelopeInput={revision:number;snapshot:HakodanPortalSnapshot};

export function readHnkTargetEnvelope(value:unknown):HnkTargetEnvelopeInput{
 if(value===undefined||value===null)throw new Error("GOODLE_HNK_TARGET_ENVELOPE_MISSING");
 if(typeof value!=="object"||Array.isArray(value)||!exactKeys(value,ENVELOPE_KEYS))invalid();
 const record=value as Record<string,unknown>;
 if(record.schema!=="hnk.target-envelope.v1"||record.target!=="goodle-browser"||record.kind!=="portal-state")invalid();
 if(typeof record.revision!=="number"||!Number.isSafeInteger(record.revision)||record.revision<=0)invalid();
 const snapshot=record.snapshot;
 if(!snapshot||typeof snapshot!=="object"||Array.isArray(snapshot)||!exactKeys(snapshot,SNAPSHOT_KEYS))invalid();
 try{return {revision:record.revision,snapshot:readHakodanPortalInput(snapshot)};}catch{invalid();}
}
