import type{InventoryState}from"./LootInventory";
export const PLAYER_SAVE_VERSION=1 as const;
export type PersistedQuest={id:string;status:"idle"|"offered"|"active"|"rewarded";progress:number;required:number;completed:boolean};
export type PlayerSave={version:typeof PLAYER_SAVE_VERSION;hp:number;maxHp:number;level:number;xp:number;nextXp:number;coins:number;inventory:InventoryState;quest:PersistedQuest|null};
export type PlayerSaveInput=Omit<PlayerSave,"version">;
export const createPlayerSave=(input:PlayerSaveInput):PlayerSave=>({version:PLAYER_SAVE_VERSION,...input});
export const serializePlayerSave=(save:PlayerSave)=>JSON.stringify(save);
export function deserializePlayerSave(raw:string|null):PlayerSave|null{if(!raw)return null;try{const v=JSON.parse(raw)as Partial<PlayerSave>;if(v.version!==PLAYER_SAVE_VERSION||typeof v.hp!=="number"||typeof v.maxHp!=="number"||typeof v.level!=="number"||typeof v.xp!=="number"||typeof v.nextXp!=="number"||typeof v.coins!=="number"||!v.inventory||!Array.isArray(v.inventory.items))return null;return v as PlayerSave}catch{return null}}
export interface PlayerSaveStorage{getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export const PLAYER_SAVE_KEY="goodle:hnkir:player:v1";
export const playerSaveKey=(scope?:string)=>scope?`${PLAYER_SAVE_KEY}:${scope}`:PLAYER_SAVE_KEY;
export function loadPlayerSave(storage:PlayerSaveStorage,scope?:string):PlayerSave|null{return deserializePlayerSave(storage.getItem(playerSaveKey(scope)))}
export function storePlayerSave(storage:PlayerSaveStorage,save:PlayerSave,scope?:string){storage.setItem(playerSaveKey(scope),serializePlayerSave(save))}
export function clearPlayerSave(storage:PlayerSaveStorage,scope?:string){storage.removeItem(playerSaveKey(scope))}