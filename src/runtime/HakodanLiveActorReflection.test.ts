import {describe,expect,it} from "vitest";import {createHakodanLiveActorReflection} from "./HakodanLiveActorReflection";
const input=(worldRevision:number,x:number,y=0,id="alakazam")=>({worldRevision,actor:{id,x,y}});
describe("live actor reflection",()=>{
 it("orders canonical movement",()=>{const live=createHakodanLiveActorReflection();expect(live.deliver(input(1,1)).disposition).toBe("created");expect(live.deliver(input(2,2)).disposition).toBe("updated");expect(live.deliver(input(3,3))).toMatchObject({disposition:"updated",acceptedRevision:3,x:3,y:0});});
 it("classifies duplicate conflict stale without rollback",()=>{const live=createHakodanLiveActorReflection();live.deliver(input(3,3));expect(live.deliver(input(3,3)).disposition).toBe("duplicate");expect(live.deliver(input(3,2)).disposition).toBe("conflict");expect(live.deliver(input(2,2)).disposition).toBe("stale");expect(live.get("alakazam")).toEqual({acceptedRevision:3,x:3,y:0});});
 it("isolates actor ids",()=>{const live=createHakodanLiveActorReflection();live.deliver(input(1,1,0,"a"));live.deliver(input(1,9,0,"b"));expect(live.get("a")?.x).toBe(1);expect(live.get("b")?.x).toBe(9);});
});
