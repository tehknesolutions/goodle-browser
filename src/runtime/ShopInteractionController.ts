import type{InventoryState}from"./LootInventory";import{buyFromShop,createShopBridge,sellToShop,useShopHealing,type ShopBridge}from"./ShopPhaserBridge";
export type ShopInteraction=ShopBridge&{open:boolean};
export function createShopInteraction(inventory:InventoryState,coins:number,hp:number,maxHp:number):ShopInteraction{return{...createShopBridge(inventory,coins,hp,maxHp),open:false}}
export const openShop=(s:ShopInteraction):ShopInteraction=>({...s,open:true});
export const closeShop=(s:ShopInteraction):ShopInteraction=>({...s,open:false});
export function buyShopItem(s:ShopInteraction,id:string):ShopInteraction{return{...s,...buyFromShop(s,id)}}
export function sellShopItem(s:ShopInteraction,id:string):ShopInteraction{return{...s,...sellToShop(s,id)}}
export function useHealingItem(s:ShopInteraction):ShopInteraction{return{...s,...useShopHealing(s)}}
