import {describe,expect,it,vi} from "vitest";
import {createHakodanPortalManifestationRegistry} from "./HakodanPortalManifestation";

const accepted=(id:string,revision:number,state:"closed"|"open",disposition:"created"|"updated"="updated")=>({id,receivedRevision:revision,acceptedRevision:revision,canonicalState:state,disposition,accepted:true as const});

describe("retained portal manifestations",()=>{
 it("reuses one handle across accepted updates",()=>{
  const handle={key:"portal-1"}; const create=vi.fn(()=>handle); const update=vi.fn();
  const registry=createHakodanPortalManifestationRegistry({create,update});
  expect(registry.apply(accepted("portal-1",1,"closed","created")).handle).toBe(handle);
  expect(registry.apply(accepted("portal-1",2,"closed")).handle).toBe(handle);
  expect(registry.apply(accepted("portal-1",3,"open")).handle).toBe(handle);
  expect(create).toHaveBeenCalledTimes(1); expect(update).toHaveBeenCalledTimes(2);
 });
 it("does not mutate visual on duplicate stale or conflict",()=>{
  const create=vi.fn(()=>({})); const update=vi.fn(); const registry=createHakodanPortalManifestationRegistry({create,update});
  registry.apply(accepted("portal-1",3,"open","created"));
  for(const disposition of ["duplicate","stale","conflict"] as const){registry.apply({id:"portal-1",receivedRevision:3,acceptedRevision:3,canonicalState:"open",disposition,accepted:false});}
  expect(update).not.toHaveBeenCalled();
 });
 it("keeps distinct handles by portal id",()=>{
  const create=vi.fn((id:string)=>({id})); const registry=createHakodanPortalManifestationRegistry({create,update:vi.fn()});
  const one=registry.apply(accepted("portal-1",1,"closed","created")); const two=registry.apply(accepted("portal-2",1,"open","created"));
  expect(one.handle).not.toBe(two.handle); expect(create).toHaveBeenCalledTimes(2);
 });
});
