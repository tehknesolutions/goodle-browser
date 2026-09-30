import type{Quest}from"./QuestRules";import{createNpcQuestRuntime,type NpcQuestRuntime}from"./NpcQuestRuntime";import{beginNpcQuestOffer,claimNpcQuestReward,completeNpcQuestEvent,handleNpcQuestChoice,type QuestEvent}from"./NpcQuestPhaserFlow";
export type NpcQuestUi={runtime:NpcQuestRuntime;quest:Quest;offerVisible:boolean;reward:{xp:number;coins:number}|null};
export const createNpcQuestUi=(quest:Quest):NpcQuestUi=>({runtime:createNpcQuestRuntime(),quest,offerVisible:false,reward:null});
export function finishDialogue(s:NpcQuestUi):NpcQuestUi{if(s.runtime.service.status!=="idle")return s;const runtime=beginNpcQuestOffer(s.runtime,s.quest);return{...s,runtime,offerVisible:runtime.offerVisible}}
export function chooseOffer(s:NpcQuestUi,choice:"accept"|"decline"):NpcQuestUi{const runtime=handleNpcQuestChoice(s.runtime,choice);return{...s,runtime,offerVisible:false}}
export function recordQuestEvent(s:NpcQuestUi,event:QuestEvent):NpcQuestUi{const r=completeNpcQuestEvent(s.runtime,s.quest,event);return{...s,runtime:r.runtime,quest:r.quest,reward:null}}
export function interactForTurnIn(s:NpcQuestUi):NpcQuestUi{const r=claimNpcQuestReward(s.runtime);return{...s,runtime:r.runtime,reward:r.reward}}
