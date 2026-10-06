import {describe,expect,it} from "vitest";
import {createHakodanLivePortalReflection} from "./HakodanLivePortalReflection";

describe("live portal reflection ordering",()=>{
 it("accepts closed@1 closed@2 open@3 in order",()=>{
  const live=createHakodanLivePortalReflection();
  expect(live.deliver({revision:1,snapshot:{id:"portal-1",state:"closed"}}).disposition).toBe("created");
  expect(live.deliver({revision:2,snapshot:{id:"portal-1",state:"closed"}}).disposition).toBe("updated");
  const last=live.deliver({revision:3,snapshot:{id:"portal-1",state:"open"}});
  expect(last).toMatchObject({disposition:"updated",acceptedRevision:3,canonicalState:"open"});
 });
 it("classifies duplicate conflict and stale without rollback",()=>{
  const live=createHakodanLivePortalReflection();
  live.deliver({revision:3,snapshot:{id:"portal-1",state:"open"}});
  expect(live.deliver({revision:3,snapshot:{id:"portal-1",state:"open"}}).disposition).toBe("duplicate");
  expect(live.deliver({revision:3,snapshot:{id:"portal-1",state:"closed"}}).disposition).toBe("conflict");
  expect(live.deliver({revision:2,snapshot:{id:"portal-1",state:"closed"}}).disposition).toBe("stale");
  expect(live.get("portal-1")).toEqual({acceptedRevision:3,canonicalState:"open"});
 });
 it("isolates portal identities",()=>{
  const live=createHakodanLivePortalReflection();
  live.deliver({revision:1,snapshot:{id:"portal-1",state:"closed"}});
  live.deliver({revision:1,snapshot:{id:"portal-2",state:"open"}});
  expect(live.get("portal-1")).toEqual({acceptedRevision:1,canonicalState:"closed"});
  expect(live.get("portal-2")).toEqual({acceptedRevision:1,canonicalState:"open"});
 });
});
