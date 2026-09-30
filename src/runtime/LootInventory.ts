export type LootItem={id:string;quantity:number};
export type InventoryState={items:LootItem[]};
export const createInventory=():InventoryState=>({items:[]});
export function addLoot(s:InventoryState,id:string,quantity=1):InventoryState{const items=s.items.map(x=>x.id===id?{...x,quantity:x.quantity+quantity}:x);if(!s.items.some(x=>x.id===id))items.push({id,quantity});return{items}}
export function hasLoot(s:InventoryState,id:string,quantity=1){return(s.items.find(x=>x.id===id)?.quantity??0)>=quantity}
export function consumeLoot(s:InventoryState,id:string,quantity=1):InventoryState{const items=s.items.map(x=>x.id===id?{...x,quantity:x.quantity-quantity}:x).filter(x=>x.quantity>0);return{items}}
