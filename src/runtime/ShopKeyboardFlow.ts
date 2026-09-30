import type{InventoryState}from"./LootInventory";import{buyShopItem,closeShop,createShopInteraction,openShop,sellShopItem,useHealingItem,type ShopInteraction}from"./ShopInteractionController";
export type ShopAction="open"|"close"|"buy"|"sell"|"heal";
export type ShopKeyboardState=ShopInteraction;
export const createShopKeyboardState=(inventory:InventoryState,coins:number,hp:number,maxHp:number):ShopKeyboardState=>createShopInteraction(inventory,coins,hp,maxHp);
export function handleShopAction(s:ShopKeyboardState,action:ShopAction,id?:string):ShopKeyboardState{if(action==="open")return openShop(s);if(action==="close")return closeShop(s);if(!s.open)return s;if(action==="buy"&&id)return buyShopItem(s,id);if(action==="sell"&&id)return sellShopItem(s,id);if(action==="heal")return useHealingItem(s);return s}
