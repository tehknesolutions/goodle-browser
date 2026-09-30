import type Phaser from "phaser";
import {applyActorVisualState} from "./PhaserActorAnimator";
import {createActorState,reduceActorState,type ActorEvent,type ActorState} from "./ActorStateMachine";
export type ActorRuntimeController={getState:()=>ActorState;dispatch:(event:ActorEvent)=>ActorState};
export function createActorRuntimeController(scene:Phaser.Scene,visual:Phaser.GameObjects.Container):ActorRuntimeController{let state=createActorState();applyActorVisualState(scene,visual,state);return{getState:()=>state,dispatch:(event)=>{const next=reduceActorState(state,event);if(next.motion!==state.motion||next.facing!==state.facing){state=next;applyActorVisualState(scene,visual,state)}else state=next;return state}}}
