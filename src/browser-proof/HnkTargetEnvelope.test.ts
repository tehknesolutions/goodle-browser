import { describe,expect,it } from "vitest";
import { readHnkTargetEnvelope } from "./HnkTargetEnvelope";

const envelope=(state:"closed"|"open"="open")=>({schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",snapshot:{id:"portal-1",state}});

describe("HNK Target Envelope v1",()=>{
 it("unpacks exact open and closed portal envelopes",()=>{
  expect(readHnkTargetEnvelope(envelope("open"))).toEqual({id:"portal-1",state:"open"});
  expect(readHnkTargetEnvelope(envelope("closed"))).toEqual({id:"portal-1",state:"closed"});
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
