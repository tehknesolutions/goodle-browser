import type {WorldTheme} from "./WorldIntentProfile";
export type AmbientPlan={motif:"canopy"|"dunes"|"frost"|"stars"|"haze";particles:"leaves"|"dust"|"snow"|"stars"|"none";parallax:number;groundDetail:number};
export type CombatFxPlan={duration:number;scale:number;alpha:number};
export function createAmbientPlan(theme:WorldTheme):AmbientPlan{if(theme==="forest")return{motif:"canopy",particles:"leaves",parallax:.22,groundDetail:8};if(theme==="desert")return{motif:"dunes",particles:"dust",parallax:.18,groundDetail:5};if(theme==="ice")return{motif:"frost",particles:"snow",parallax:.15,groundDetail:7};if(theme==="space")return{motif:"stars",particles:"stars",parallax:.08,groundDetail:3};return{motif:"haze",particles:"none",parallax:.2,groundDetail:4}}
export function createCombatFxPlan(kind:"attack"|"impact"):CombatFxPlan{return kind==="attack"?{duration:130,scale:1.25,alpha:.75}:{duration:180,scale:1.4,alpha:.9}}
