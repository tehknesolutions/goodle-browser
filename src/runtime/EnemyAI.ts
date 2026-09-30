export type EnemyAIMode="idle"|"chase"|"windup"|"attack"|"cooldown"|"hit"|"death";
export type EnemyAIState={mode:EnemyAIMode;since:number;lastAttack:number};
export type EnemyAIInput={now:number;distance:number;perception:number;attackRange:number};
export const createEnemyAIState=():EnemyAIState=>({mode:"idle",since:0,lastAttack:-9999});
export function updateEnemyAI(s:EnemyAIState,i:EnemyAIInput):EnemyAIState{if(s.mode==="death")return s;if(s.mode==="hit")return i.now-s.since>=180?{...s,mode:i.distance<=i.perception?"chase":"idle",since:i.now}:s;if(s.mode==="attack")return{mode:"cooldown",since:i.now,lastAttack:i.now};if(s.mode==="cooldown")return i.now-s.lastAttack>=700?{...s,mode:i.distance<=i.attackRange?"windup":i.distance<=i.perception?"chase":"idle",since:i.now}:s;if(s.mode==="windup")return i.distance>i.attackRange?{...s,mode:"chase",since:i.now}:i.now-s.since>=320?{...s,mode:"attack",since:i.now}:s;if(i.distance<=i.attackRange)return{...s,mode:"windup",since:i.now};if(i.distance<=i.perception)return{...s,mode:"chase",since:i.now};return s.mode==="idle"?s:{...s,mode:"idle",since:i.now}}
export const enemyAIHit=(s:EnemyAIState,now:number):EnemyAIState=>s.mode==="death"?s:{...s,mode:"hit",since:now};
export const enemyAIDeath=(s:EnemyAIState,now:number):EnemyAIState=>({...s,mode:"death",since:now});
