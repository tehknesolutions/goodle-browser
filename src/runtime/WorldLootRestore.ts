import type{LootDrop}from"./LootDrop";
export function lootSaveId(drop:Pick<LootDrop,"id"|"x"|"y">){return drop.id+":"+Math.round(drop.x)+":"+Math.round(drop.y)}
export function restoreWorldLoot(drops:LootDrop[],collectedIds:string[]){const collected=new Set(collectedIds);return drops.filter(d=>!d.collected&&!collected.has(lootSaveId(d)))}
export function restoreGeneratedLoot(generatedIds:string[],collectedIds:string[]){const collected=new Set(collectedIds);return generatedIds.map(raw=>{const parts=raw.split(":");const id=parts[0],x=Number(parts[1]),y=Number(parts[2]);return{id,x,y,collected:collected.has(raw)}}).filter(d=>Number.isFinite(d.x)&&Number.isFinite(d.y)&&!d.collected) as LootDrop[]}
