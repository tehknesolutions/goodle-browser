import { describe,expect,it } from "vitest";
import { readHnkTargetEnvelope } from "./HnkTargetEnvelope";
import { createHakodanPortalVisualProof } from "./HakodanPortalBrowserProof";

const envelope=(state:"closed"|"open")=>({schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",snapshot:{id:"portal-1",state}});

describe("HNK envelope browser proof boundary",()=>{
 it("maps open envelope to open manifestation evidence",()=>{
  expect(createHakodanPortalVisualProof(readHnkTargetEnvelope(envelope("open")))).toEqual({id:"portal-1",canonicalState:"open",visualState:"open",rendered:true,manifestation:"portal-open"});
 });
 it("maps closed envelope to closed manifestation evidence",()=>{
  expect(createHakodanPortalVisualProof(readHnkTargetEnvelope(envelope("closed")))).toEqual({id:"portal-1",canonicalState:"closed",visualState:"closed",rendered:true,manifestation:"portal-closed"});
 });
 it("fails explicitly when envelope is missing",()=>{
  expect(()=>readHnkTargetEnvelope(undefined)).toThrow("GOODLE_HNK_TARGET_ENVELOPE_MISSING");
 });
});
