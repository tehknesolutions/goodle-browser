import{advanceQuest,type Quest}from"./QuestRules";import{chooseQuestOffer,consumeNpcQuestReward,openQuestOffer,syncQuestProgress,turnInCompletedQuest,type NpcQuestRuntime}from"./NpcQuestRuntime";
export type QuestEvent={type:"defeat"|"collect"|"reach";target:string};
export const beginNpcQuestOffer=(runtime:NpcQuestRuntime,quest:Quest)=>openQuestOffer(runtime,quest);
export const handleNpcQuestChoice=(runtime:NpcQuestRuntime,choice:"accept"|"decline")=>chooseQuestOffer(runtime,choice);
export function completeNpcQuestEvent(runtime:NpcQuestRuntime,quest:Quest,event:QuestEvent){if(runtime.service.status!=="active")return{runtime,quest};const next=advanceQuest(quest,event);return{quest:next,runtime:syncQuestProgress(runtime,next)}}
export function claimNpcQuestReward(runtime:NpcQuestRuntime){const turned=turnInCompletedQuest(runtime),reward=turned.pendingReward;return{runtime:reward?consumeNpcQuestReward(turned):turned,reward}}
