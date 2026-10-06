export type InteractionIntent={actorId:"alakazam";interaction:"enter";targetId:"portal-1"};
export function interactionIntentForKey(key:string):InteractionIntent|undefined{return key==="Enter"?{actorId:"alakazam",interaction:"enter",targetId:"portal-1"}:undefined;}
export function submitInteractionKey(key:string,host:((intent:InteractionIntent)=>unknown)|undefined){const intent=interactionIntentForKey(key);if(!intent)return undefined;if(!host)throw new Error("GOODLE_HNK_CANONICAL_INTERACTION_HOST_MISSING");return host(intent);}
