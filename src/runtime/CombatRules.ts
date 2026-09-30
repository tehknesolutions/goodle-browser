import type {CreationObjective} from "./IntentParser";
export type CombatState={enemyHp:Record<string,number>;defeated:number;total:number;objective:CreationObjective;completed:boolean};
export function createCombatState(total:number,objective:CreationObjective):CombatState{const enemyHp:Record<string,number>={};for(let i=0;i<total;i++)enemyHp[`enemy-${i}`]=100;return{enemyHp,defeated:0,total,objective,completed:false}}
export function damageEnemy(s:CombatState,id:string,damage:number):CombatState{const before=s.enemyHp[id];if(before===undefined||before<=0)return s;const hp=Math.max(0,before-Math.max(0,damage)),enemyHp={...s.enemyHp,[id]:hp},defeated=s.defeated+(before>0&&hp===0?1:0);return{...s,enemyHp,defeated,completed:s.objective==="defeat-enemies"&&s.total>0&&defeated>=s.total}}
