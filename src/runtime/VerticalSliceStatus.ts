export const M9_VERTICAL_SLICE_CAPABILITIES=["combat","enemyAI","rewards","loot","quest","npc","shop","portalVictory","playerSave","worldSave","hud"] as const;
export type VerticalSliceCapability=typeof M9_VERTICAL_SLICE_CAPABILITIES[number];
