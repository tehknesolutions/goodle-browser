import {readHnkTargetEnvelope} from "./HnkTargetEnvelope";
import {createHakodanLivePortalReflection} from "../runtime/HakodanLivePortalReflection";
import {createHakodanPortalManifestationRegistry} from "./HakodanPortalManifestation";

export function createHnkLiveTargetDelivery<H>(drawing:{create:(id:string,state:"closed"|"open")=>H;update:(handle:H,state:"closed"|"open")=>void}){
 const live=createHakodanLivePortalReflection(); const manifestations=createHakodanPortalManifestationRegistry(drawing);
 return {deliver(value:unknown){const input=readHnkTargetEnvelope(value);return manifestations.apply(live.deliver(input));}};
}
