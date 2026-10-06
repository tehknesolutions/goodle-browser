export type MovementIntent={actorId:"alakazam";direction:"left"|"right"|"up"|"down"};
const DIRECTIONS:Record<string,MovementIntent["direction"]>={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};
export function movementIntentForKey(key:string):MovementIntent|undefined{const direction=DIRECTIONS[key];return direction?{actorId:"alakazam",direction}:undefined;}
export function submitMovementKey(key:string,host:((intent:MovementIntent)=>unknown)|undefined){const intent=movementIntentForKey(key);if(!intent)return undefined;if(!host)throw new Error("GOODLE_HNK_CANONICAL_HOST_MISSING");return host(intent);}
