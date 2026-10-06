import { describe,expect,it } from "vitest";
import { readHnkTargetEnvelope } from "./HnkTargetEnvelope";

const envelope=(state:"closed"|"open"="open",revision:number=3)=>({schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision,snapshot:{id:"portal-1",state}});

describe("HNK Target Envelope v1 live revision",()=>{
 it("unpacks exact open and closed live envelopes",()=>{
  expect(readHnkTargetEnvelope(envelope("open",3))).toEqual({revision:3,snapshot:{id:"portal-1",state:"open"}});
  expect(readHnkTargetEnvelope(envelope("closed",2))).toEqual({revision:2,snapshot:{id:"portal-1",state:"closed"}});
 });
 it("rejects old shape and invalid revisions",()=>{
  const {revision,...old}=envelope();
  expect(()=>readHnkTargetEnvelope(old)).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
  for(const bad of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1,"3"]){
   expect(()=>readHnkTargetEnvelope({...envelope(),revision:bad})).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
  }
 });
 it("rejects missing, unsupported schema, wrong target and wrong kind",()=>{
  expect(()=>readHnkTargetEnvelope(undefined)).toThrow("GOODLE_HNK_TARGET_ENVELOPE_MISSING");
  expect(()=>readHnkTargetEnvelope({...envelope(),schema:"hnk.target-envelope.v2"})).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
  expect(()=>readHnkTargetEnvelope({...envelope(),target:"other"})).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
  expect(()=>readHnkTargetEnvelope({...envelope(),kind:"other"})).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
 });
 it("rejects extra envelope and snapshot keys",()=>{
  expect(()=>readHnkTargetEnvelope({...envelope(),extra:true})).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
  expect(()=>readHnkTargetEnvelope({...envelope(),snapshot:{...envelope().snapshot,extra:true}})).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
 });
 it("does not read forbidden extra property values",()=>{
  let touched=0; const value:any=envelope();
  Object.defineProperty(value,"callback",{enumerable:true,get(){touched++;throw new Error("EXECUTED");}});
  expect(()=>readHnkTargetEnvelope(value)).toThrow("GOODLE_HNK_TARGET_ENVELOPE_INVALID");
  expect(touched).toBe(0);
 });
 it("does not mutate caller envelope",()=>{
  const value=envelope(); const before=structuredClone(value);
  readHnkTargetEnvelope(value); expect(value).toEqual(before);
 });
});
