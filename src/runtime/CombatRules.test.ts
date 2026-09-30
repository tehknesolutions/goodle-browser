import {describe,expect,it} from "vitest";
import {createCombatState,damageEnemy} from "./CombatRules";
describe("combat rules",()=>{it("defeats enemies and completes defeat-enemies objective",()=>{let s=createCombatState(2,"defeat-enemies");s=damageEnemy(s,"enemy-0",100);expect(s.defeated).toBe(1);expect(s.completed).toBe(false);s=damageEnemy(s,"enemy-1",100);expect(s.defeated).toBe(2);expect(s.completed).toBe(true)});it("does not complete explore objective by combat",()=>{let s=createCombatState(1,"explore");s=damageEnemy(s,"enemy-0",100);expect(s.completed).toBe(false)})});
