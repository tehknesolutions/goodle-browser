import{canInteract,type Npc}from"./NpcInteraction";
export type DialogueState={open:boolean;npcId:string|null;line:number};
export const createDialogueState=():DialogueState=>({open:false,npcId:null,line:0});
export function openDialogue(s:DialogueState,n:Npc,px:number,py:number):DialogueState{return canInteract(n,px,py)?{open:true,npcId:n.id,line:0}:s}
export function advanceDialogue(s:DialogueState,n:Npc):DialogueState{if(!s.open||s.npcId!==n.id)return s;if(s.line>=n.dialogue.length-1)return createDialogueState();return{...s,line:s.line+1}}
export const closeDialogue=():DialogueState=>createDialogueState();