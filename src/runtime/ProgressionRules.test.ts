import {describe,expect,it} from "vitest";
import {createProgressionState,applyReward,rewardForEnemy} from "./ProgressionRules";
describe("ProgressionRules",()=>{it("awards biome-specific loot",()=>{expect(rewardForEnemy("hunter").loot).toContain("void-fragment");expect(rewardForEnemy("sentinel").xp).toBe(40)});it("levels up and carries overflow xp",()=>{const s=applyReward(createProgressionState(),{xp:120,coins:10,loot:["x"]});expect(s.level).toBe(2);expect(s.xp).toBe(20);expect(s.coins).toBe(10)});});
