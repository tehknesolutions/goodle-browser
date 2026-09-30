export const M9_VERTICAL_SLICE={combat:true,enemyAI:true,rewards:true,loot:true,quest:true,npc:true,shop:true,portalVictory:true,playerSave:true,worldSave:true,hud:true}as const;
export type VerticalSliceCapability=keyof typeof M9_VERTICAL_SLICE;
export const isVerticalSliceReady=()=>Object.values(M9_VERTICAL_SLICE).every(Boolean);
