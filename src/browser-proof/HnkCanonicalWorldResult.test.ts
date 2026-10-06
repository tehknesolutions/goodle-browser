import {describe,expect,it} from "vitest";import {readHnkCanonicalWorldResult} from "./HnkCanonicalWorldResult";
const value=()=>({worldRevision:3,actor:{id:"alakazam",x:3,y:0},targetEnvelope:{schema:"hnk.target-envelope.v1",target:"goodle-browser",kind:"portal-state",revision:3,snapshot:{id:"portal-1",state:"open"}}});
describe("canonical world result",()=>{
 it("accepts exact causal result",()=>expect(readHnkCanonicalWorldResult(value())).toEqual(value()));
 it("rejects invalid revisions coordinates extras and revision mismatch",()=>{for(const bad of [{...value(),worldRevision:0},{...value(),worldRevision:1.5},{...value(),extra:true},{...value(),actor:{...value().actor,x:Infinity}},{...value(),actor:{...value().actor,extra:true}},{...value(),targetEnvelope:{...value().targetEnvelope,revision:2}}])expect(()=>readHnkCanonicalWorldResult(bad)).toThrow("GOODLE_HNK_CANONICAL_WORLD_RESULT_INVALID");});
 it("rejects extra accessor without evaluating it",()=>{let touched=0;const input:any=value();Object.defineProperty(input,"callback",{enumerable:true,get(){touched++;throw new Error("EXECUTED");}});expect(()=>readHnkCanonicalWorldResult(input)).toThrow("GOODLE_HNK_CANONICAL_WORLD_RESULT_INVALID");expect(touched).toBe(0);});
 it("does not mutate caller",()=>{const input=value(),before=structuredClone(input);readHnkCanonicalWorldResult(input);expect(input).toEqual(before);});
});
