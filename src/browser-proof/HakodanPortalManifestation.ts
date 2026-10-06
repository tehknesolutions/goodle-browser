import type {LiveResult} from "../runtime/HakodanLivePortalReflection";

type Accepted=LiveResult&{accepted:true};
type Drawing<H>={create:(id:string,state:"closed"|"open")=>H;update:(handle:H,state:"closed"|"open")=>void};

export function createHakodanPortalManifestationRegistry<H>(drawing:Drawing<H>){
 const handles=new Map<string,H>(); const renderedRevision=new Map<string,number>();
 return {apply(result:LiveResult){
  const existing=handles.get(result.id);
  if(!result.accepted)return{...result,handle:existing,rendered:false,renderedRevision:renderedRevision.get(result.id)};
  const accepted=result as Accepted;
  let handle=existing;
  if(!handle){handle=drawing.create(accepted.id,accepted.canonicalState);handles.set(accepted.id,handle);}else drawing.update(handle,accepted.canonicalState);
  renderedRevision.set(accepted.id,accepted.acceptedRevision);
  return{...accepted,handle,visualState:accepted.canonicalState,manifestation:accepted.canonicalState==="open"?"portal-open":"portal-closed",rendered:true,renderedRevision:accepted.acceptedRevision};
 }};
}
