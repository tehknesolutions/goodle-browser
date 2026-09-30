import type{LootDrop}from"./LootDrop";
export function lootSaveId(drop:Pick<LootDrop,"id"|"x"|"y">){return drop.id+":"+Math.round(drop.x)+":"+Math.round(drop.y)}
export function restoreWorldLoot(drops:LootDrop[],collectedIds:string[]){const collected=new Set(collectedIds);return drops.filter(d=>!d.collected&&!collected.has(lootSaveId(d)))}