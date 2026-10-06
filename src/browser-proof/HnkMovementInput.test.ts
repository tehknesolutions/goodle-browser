import {describe,expect,it,vi} from "vitest";import {movementIntentForKey,submitMovementKey} from "./HnkMovementInput";
describe("movement input boundary",()=>{
 it("maps arrows only to bounded movement intent",()=>{expect(movementIntentForKey("ArrowRight")).toEqual({actorId:"alakazam",direction:"right"});expect(movementIntentForKey("ArrowLeft")).toEqual({actorId:"alakazam",direction:"left"});expect(movementIntentForKey("ArrowUp")).toEqual({actorId:"alakazam",direction:"up"});expect(movementIntentForKey("ArrowDown")).toEqual({actorId:"alakazam",direction:"down"});expect(movementIntentForKey("KeyD")).toBeUndefined();});
 it("does not synthesize canonical position when host is absent",()=>{expect(()=>submitMovementKey("ArrowRight",undefined)).toThrow("GOODLE_HNK_CANONICAL_HOST_MISSING");});
 it("submits intent and returns only host result",()=>{const canonical={worldRevision:1,actor:{id:"alakazam",x:1,y:0},targetEnvelope:{}};const host=vi.fn(()=>canonical);expect(submitMovementKey("ArrowRight",host)).toBe(canonical);expect(host).toHaveBeenCalledWith({actorId:"alakazam",direction:"right"});});
});
