export const WORLD_SAVE_VERSION=1 as const;
export type WorldStatus="playing"|"victory"|"defeat";
export type WorldSave={version:typeof WORLD_SAVE_VERSION;manifestationId:string;seed:number;defeatedEnemyIds:string[];generatedLootIds:string[];collectedLootIds:string[];completedPortalIds:string[];status:WorldStatus};
export type WorldSaveInput=Omit<WorldSave,"version">;
export const createWorldSave=(input:WorldSaveInput):WorldSave=>({version:WORLD_SAVE_VERSION,...input});
export const serializeWorldSave=(save:WorldSave)=>JSON.stringify(save);
export function deserializeWorldSave(raw:string|null):WorldSave|null{if(!raw)return null;try{const v=JSON.parse(raw)as Partial<WorldSave>;if(v.version!==WORLD_SAVE_VERSION||typeof v.manifestationId!=="string"||typeof v.seed!=="number"||!Array.isArray(v.defeatedEnemyIds)||!Array.isArray(v.generatedLootIds??[])||!Array.isArray(v.collectedLootIds)||!Array.isArray(v.completedPortalIds)||!["playing","victory","defeat"].includes(v.status??""))return null;return {...v,generatedLootIds:v.generatedLootIds??[]} as WorldSave}catch{return null}}
export const WORLD_SAVE_KEY=(manifestationId:string)=>`goodle:hnkir:world:v1:${manifestationId}`;
export interface WorldSaveStorage{getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
export function loadWorldSave(storage:WorldSaveStorage,manifestationId:string){return deserializeWorldSave(storage.getItem(WORLD_SAVE_KEY(manifestationId)))}
export function storeWorldSave(storage:WorldSaveStorage,save:WorldSave){storage.setItem(WORLD_SAVE_KEY(save.manifestationId),serializeWorldSave(save))}