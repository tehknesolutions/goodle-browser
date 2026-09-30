export type DialogueLine={speaker:string;text:string};
export type Npc={id:string;name:string;x:number;y:number;dialogue:DialogueLine[]};
export function canInteract(n:Npc,px:number,py:number,radius=52){return Math.hypot(px-n.x,py-n.y)<=radius}
export function nextDialogue(index:number,n:Npc){return Math.min(index+1,Math.max(0,n.dialogue.length-1))}
export function createNpc(id:string,name:string,x:number,y:number):Npc{return{id,name,x,y,dialogue:[{speaker:name,text:"Bem-vindo ao mundo Goodle."},{speaker:name,text:"Explore, enfrente desafios e descubra o que este lugar guarda."}]}}
