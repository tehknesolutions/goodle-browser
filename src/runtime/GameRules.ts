export type GameStatus="playing"|"victory"|"defeat";
export type GameState={hp:number;maxHp:number;status:GameStatus};
export const createGameState=():GameState=>({hp:100,maxHp:100,status:"playing"});
export function damagePlayer(s:GameState,damage:number):GameState{if(s.status!=="playing")return s;const hp=Math.max(0,s.hp-Math.max(0,damage));return{...s,hp,status:hp===0?"defeat":"playing"}}
export function completeObjective(s:GameState):GameState{return s.status==="playing"?{...s,status:"victory"}:s}
