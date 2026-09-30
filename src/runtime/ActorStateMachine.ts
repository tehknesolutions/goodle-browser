export type ActorFacing="left"|"right"|"up"|"down";
export type ActorMotion="idle"|"run"|"attack"|"hit"|"death";
export type ActorState={facing:ActorFacing;motion:ActorMotion};
export type ActorEvent={type:"move";x:number;y:number}|{type:"attack"}|{type:"hit"}|{type:"death"}|{type:"recover"};
export const createActorState=():ActorState=>({facing:"down",motion:"idle"});
export function reduceActorState(s:ActorState,e:ActorEvent):ActorState{if(s.motion==="death")return s;if(e.type==="death")return{...s,motion:"death"};if(e.type==="hit")return{...s,motion:"hit"};if(e.type==="attack")return{...s,motion:"attack"};if(e.type==="recover")return{...s,motion:"idle"};const moving=e.x!==0||e.y!==0;if(!moving)return{...s,motion:"idle"};const facing=Math.abs(e.x)>Math.abs(e.y)?(e.x<0?"left":"right"):(e.y<0?"up":"down");return{facing,motion:"run"}}
