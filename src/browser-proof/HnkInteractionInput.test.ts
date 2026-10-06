import {describe,expect,it,vi} from "vitest";
import {interactionIntentForKey,submitInteractionKey} from "./HnkInteractionInput";
describe("interaction input boundary",()=>{
 it("maps Enter only to the exact portal entry intent",()=>{expect(interactionIntentForKey("Enter")).toEqual({actorId:"alakazam",interaction:"enter",targetId:"portal-1"});expect(interactionIntentForKey("Space")).toBeUndefined();});
 it("requires a canonical host",()=>expect(()=>submitInteractionKey("Enter",undefined)).toThrow("GOODLE_HNK_CANONICAL_INTERACTION_HOST_MISSING"));
 it("returns only the canonical host result",()=>{const result={accepted:true};const host=vi.fn(()=>result);expect(submitInteractionKey("Enter",host)).toBe(result);expect(host).toHaveBeenCalledWith({actorId:"alakazam",interaction:"enter",targetId:"portal-1"});});
});
