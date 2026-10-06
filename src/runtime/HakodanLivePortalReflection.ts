import type {HnkTargetEnvelopeInput} from "../browser-proof/HnkTargetEnvelope";

type State={acceptedRevision:number;canonicalState:"closed"|"open"};
export type LiveDisposition="created"|"updated"|"duplicate"|"stale"|"conflict";
export type LiveResult=State&{id:string;receivedRevision:number;disposition:LiveDisposition;accepted:boolean};

export function createHakodanLivePortalReflection(){
 const states=new Map<string,State>();
 return {
  deliver(input:HnkTargetEnvelopeInput):LiveResult{
   const {revision,snapshot}=input; const previous=states.get(snapshot.id);
   if(!previous){const next={acceptedRevision:revision,canonicalState:snapshot.state};states.set(snapshot.id,next);return{id:snapshot.id,receivedRevision:revision,...next,disposition:"created",accepted:true};}
   if(revision<previous.acceptedRevision)return{id:snapshot.id,receivedRevision:revision,...previous,disposition:"stale",accepted:false};
   if(revision===previous.acceptedRevision){const same=previous.canonicalState===snapshot.state;return{id:snapshot.id,receivedRevision:revision,...previous,disposition:same?"duplicate":"conflict",accepted:false};}
   const next={acceptedRevision:revision,canonicalState:snapshot.state};states.set(snapshot.id,next);return{id:snapshot.id,receivedRevision:revision,...next,disposition:"updated",accepted:true};
  },
  get(id:string):State|undefined{const value=states.get(id);return value?{...value}:undefined;}
 };
}
