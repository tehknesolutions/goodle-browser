import { readHakodanPortalInput } from "./HakodanPortalInput";
import type { HakodanPortalSnapshot } from "../runtime/HakodanPortalReflection";

const ENVELOPE_KEYS=["kind","schema","snapshot","target"];
const SNAPSHOT_KEYS=["id","state"];
function exactKeys(value:object,expected:string[]){const keys=Object.keys(value).sort();return keys.length===expected.length&&keys.every((key,index)=>key===expected[index]);}
function invalid():never{throw new Error("GOODLE_HNK_TARGET_ENVELOPE_INVALID");}

export function readHnkTargetEnvelope(value:unknown):HakodanPortalSnapshot{
 if(value===undefined||value===null)throw new Error("GOODLE_HNK_TARGET_ENVELOPE_MISSING");
 if(typeof value!=="object"||Array.isArray(value)||!exactKeys(value,ENVELOPE_KEYS))invalid();
 const record=value as Record<string,unknown>;
 if(record.schema!=="hnk.target-envelope.v1"||record.target!=="goodle-browser"||record.kind!=="portal-state")invalid();
 const snapshot=record.snapshot;
 if(!snapshot||typeof snapshot!=="object"||Array.isArray(snapshot)||!exactKeys(snapshot,SNAPSHOT_KEYS))invalid();
 try{return readHakodanPortalInput(snapshot);}catch{invalid();}
}
