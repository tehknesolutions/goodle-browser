export type LootDrop={id:string;x:number;y:number;collected:boolean};
export function createLootDrop(id:string,x:number,y:number):LootDrop{return{id,x,y,collected:false}}
export function canCollect(drop:LootDrop,px:number,py:number,radius=28){return !drop.collected&&Math.hypot(px-drop.x,py-drop.y)<=radius}
export function collectLoot(drop:LootDrop):LootDrop{return{...drop,collected:true}}
