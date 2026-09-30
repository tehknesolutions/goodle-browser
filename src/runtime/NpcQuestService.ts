import type{Quest}from"./QuestRules";
export type NpcQuestStatus="idle"|"offered"|"active"|"rewarded";
export type NpcQuestService={status:NpcQuestStatus;quest:Quest|null;reward:{xp:number;coins:number}|null};
export const createNpcQuestService=():NpcQuestService=>({status:"idle",quest:null,reward:null});
export function offerNpcQuest(s:NpcQuestService,quest:Quest):NpcQuestService{return s.status==="idle"?{status:"offered",quest,reward:null}:s}
export function acceptNpcQuest(s:NpcQuestService):NpcQuestService{return s.status==="offered"?{...s,status:"active"}:s}
export function declineNpcQuest(s:NpcQuestService):NpcQuestService{return s.status==="offered"?createNpcQuestService():s}
export function syncNpcQuest(s:NpcQuestService,quest:Quest):NpcQuestService{return s.status==="active"?{...s,quest}:s}
export function turnInNpcQuest(s:NpcQuestService):NpcQuestService{if(s.status!=="active"||!s.quest?.completed)return s;return{...s,status:"rewarded",reward:{xp:s.quest.rewardXp,coins:s.quest.rewardCoins}}}