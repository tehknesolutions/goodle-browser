import {parseCreationIntent,type CreationObjective} from "./IntentParser";
import {generateWorld} from "./WorldGenerator";
import {createWorldThemeRules,type WorldThemeRules} from "./WorldThemeRules";
import type {WorldIntentProfile} from "./WorldIntentProfile";
export type ExperienceKind="platformer"|"top-down"|"sandbox";
export type ManifestationEntity={kind:"player"|"platform"|"enemy"|"object"|"obstacle"|"portal";x:number;y:number;width:number;height:number};
export type ManifestationArtifact={id:string;kind:"interactive-experience";runtime:"phaser";framework:"react";title:string;experience:ExperienceKind;objective:CreationObjective;camera:"follow-player"|"fixed";world:{width:number;height:number;seed:number;profile:WorldIntentProfile;rules:WorldThemeRules};controls:{horizontal:boolean;vertical:boolean;jump:boolean};scene:{key:"ManifestationScene";background:number;entities:ManifestationEntity[]}};
function hashSeed(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function compileManifestationArtifact(intent:string):ManifestationArtifact{const title=intent.trim()||"Untitled manifestation",parsed=parseCreationIntent(title),experience=parsed.experience,seed=hashSeed(title),world=generateWorld(parsed,seed),rules=createWorldThemeRules(world.profile);return{id:`manifest-${seed}`,kind:"interactive-experience",runtime:"phaser",framework:"react",title,experience,objective:parsed.objective,camera:parsed.camera,world:{width:world.width,height:world.height,seed:world.seed,profile:world.profile,rules},controls:{horizontal:true,vertical:experience!=="platformer",jump:experience==="platformer"},scene:{key:"ManifestationScene",background:rules.background,entities:world.entities}}}
