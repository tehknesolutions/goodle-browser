import type{InventoryState}from"./LootInventory";import{buySelected,createShopRuntime,sellSelected,useHealingCore,type ShopRuntime}from"./ShopRuntime";
export type ShopBridge=ShopRuntime;
export function createShopBridge(inventory:InventoryState,coins:number,hp:number,maxHp:number):ShopBridge{return{...createShopRuntime(coins,hp,maxHp),inventory}}
export const buyFromShop=(s:ShopBridge,id:string)=>buySelected(s,id);
export const sellToShop=(s:ShopBridge,id:string)=>sellSelected(s,id);
export const useShopHealing=(s:ShopBridge)=>useHealingCore(s);
