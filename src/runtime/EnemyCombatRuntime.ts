import {createEnemyAIState,updateEnemyAI,type EnemyAIState} from "./EnemyAI";
export type EnemyCombatDecision={state:EnemyAIState;move:boolean;windup:boolean;attack:boolean;stop:boolean};
export const createEnemyCombatState=createEnemyAIState;
export function decideEnemyCombat(state:EnemyAIState,now:number,distance:number,perception=260,attackRange=54):EnemyCombatDecision{const next=updateEnemyAI(state,{now,distance,perception,attackRange});return{state:next,move:next.mode==="chase",windup:next.mode==="windup",attack:next.mode==="attack",stop:next.mode==="windup"||next.mode==="attack"||next.mode==="cooldown"||next.mode==="hit"||next.mode==="death"}}
