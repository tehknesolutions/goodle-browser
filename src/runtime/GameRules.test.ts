import {describe,expect,it} from "vitest";
import {createGameState,damagePlayer,completeObjective} from "./GameRules";
describe("game rules",()=>{it("tracks health and defeat",()=>{let s=createGameState();s=damagePlayer(s,40);expect(s.hp).toBe(60);expect(s.status).toBe("playing");s=damagePlayer(s,70);expect(s.hp).toBe(0);expect(s.status).toBe("defeat")});it("tracks objective victory",()=>{expect(completeObjective(createGameState()).status).toBe("victory")})});
