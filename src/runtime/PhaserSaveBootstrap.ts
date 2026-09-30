import type{Quest}from"./QuestRules";import type{createPhaserSaveSession}from"./PhaserSaveSession";import{restoreQuestUi}from"./QuestPersistence";
type SaveSession=ReturnType<typeof createPhaserSaveSession>;
export function bootstrapPhaserSave(session:SaveSession,baseQuest:Quest){const loaded=session.load();return{state:loaded.state,progression:loaded.progression,inventory:loaded.inventory,questUi:restoreQuestUi(baseQuest,loaded.quest)}}
