export type ProgressionState={level:number;xp:number;nextXp:number;coins:number;loot:string[]};
export type DefeatReward={xp:number;coins:number;loot:string[]};
export const createProgressionState=():ProgressionState=>({level:1,xp:0,nextXp:100,coins:0,loot:[]});
export function rewardForEnemy(archetype:string):DefeatReward{const table:Record<string,DefeatReward>={stalker:{xp:30,coins:8,loot:["forest-seed"]},raider:{xp:45,coins:12,loot:["sun-shard"]},sentinel:{xp:40,coins:10,loot:["frost-core"]},hunter:{xp:55,coins:16,loot:["void-fragment"]},wanderer:{xp:25,coins:6,loot:["strange-scrap"]}};return table[archetype]??table.wanderer}
export function applyReward(s:ProgressionState,r:DefeatReward):ProgressionState{let xp=s.xp+r.xp,level=s.level,nextXp=s.nextXp,coins=s.coins+r.coins;while(xp>=nextXp){xp-=nextXp;level++;nextXp=100+(level-1)*50}return{level,xp,nextXp,coins,loot:[...s.loot,...r.loot]}}
