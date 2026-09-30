import type {ActorFacing} from "./ActorStateMachine";
export type AttackZone={x:number;y:number;width:number;height:number};
export function attackZone(x:number,y:number,facing:ActorFacing,range=72):AttackZone{const vertical=facing==="up"||facing==="down",d=range/2;return{x:x+(facing==="left"?-d:facing==="right"?d:0),y:y+(facing==="up"?-d:facing==="down"?d:0),width:vertical?48:range,height:vertical?range:48}}
export function pointInAttackZone(px:number,py:number,z:AttackZone){return Math.abs(px-z.x)<=z.width/2&&Math.abs(py-z.y)<=z.height/2}
export function knockbackVector(ax:number,ay:number,tx:number,ty:number,force=180){const dx=tx-ax,dy=ty-ay,d=Math.hypot(dx,dy)||1;return{x:dx/d*force,y:dy/d*force}}
export function canReceiveHit(now:number,lastHit:number,windowMs=500){return now-lastHit>=windowMs}
