import {describe,expect,it,vi} from "vitest";
import {createHnkLiveTargetDelivery} from "./HnkLiveTargetDelivery";
const envelope=(revision:number,state:"closed"|"open",id="portal-1")=>({schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision,snapshot:{id,state}});

describe("live HNK target delivery",()=>{
 it("delivers ordered revisions through render evidence",()=>{
  const delivery=createHnkLiveTargetDelivery({create:vi.fn((id:string)=>({id})),update:vi.fn()});
  expect(delivery.deliver(envelope(1,"closed"))).toMatchObject({disposition:"created",receivedRevision:1,acceptedRevision:1,renderedRevision:1,canonicalState:"closed",visualState:"closed",rendered:true});
  expect(delivery.deliver(envelope(2,"closed"))).toMatchObject({disposition:"updated",renderedRevision:2,rendered:true});
  expect(delivery.deliver(envelope(3,"open"))).toMatchObject({disposition:"updated",acceptedRevision:3,renderedRevision:3,manifestation:"portal-open",rendered:true});
 });
 it("does not advance render evidence for duplicate conflict or stale",()=>{
  const update=vi.fn(); const delivery=createHnkLiveTargetDelivery({create:vi.fn(()=>({})),update});
  delivery.deliver(envelope(3,"open")); update.mockClear();
  expect(delivery.deliver(envelope(3,"open"))).toMatchObject({disposition:"duplicate",rendered:false,renderedRevision:3});
  expect(delivery.deliver(envelope(3,"closed"))).toMatchObject({disposition:"conflict",rendered:false,renderedRevision:3});
  expect(delivery.deliver(envelope(2,"closed"))).toMatchObject({disposition:"stale",rendered:false,renderedRevision:3});
  expect(update).not.toHaveBeenCalled();
 });
 it("rejects invalid envelope before runtime mutation",()=>{
  const create=vi.fn(); const delivery=createHnkLiveTargetDelivery({create,update:vi.fn()});
  expect(()=>delivery.deliver({...envelope(1,"closed"),revision:0})).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
  expect(create).not.toHaveBeenCalled();
 });
});
