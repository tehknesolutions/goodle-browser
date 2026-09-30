import {parseCreationIntent,type CreationObjective} from "./IntentParser";
export type ExperienceKind="platformer"|"top-down"|"sandbox";
export type ManifestationEntity={kind:"player"|"platform"|"enemy"|"object"|"obstacle"|"portal";x:number;y:number;width:number;height:number};
export type ManifestationArtifact={id:string;kind:"interactive-experience";runtime:"phaser";framework:"react";title:string;experience:ExperienceKind;objective:CreationObjective;camera:"follow-player"|"fixed";controls:{horizontal:boolean;vertical:boolean;jump:boolean};scene:{key:"ManifestationScene";background:number;entities:ManifestationEntity[]}};
export function compileManifestationArtifact(intent:string):ManifestationArtifact{
 const title=intent.trim()||"Untitled manifestation",parsed=parseCreationIntent(title),experience=parsed.experience;
 const entities:ManifestationEntity[]=[{kind:"player",x:120,y:220,width:28,height:36}];
 if(experience==="platformer")entities.push({kind:"platform",x:320,y:360,width:520,height:28},{kind:"platform",x:470,y:275,width:150,height:18});
 if(experience==="top-down")entities.push({kind:"object",x:340,y:190,width:54,height:54});
 if(experience==="sandbox")entities.push({kind:"object",x:320,y:240,width:72,height:72});
 for(let i=0;i<parsed.entities.enemies;i++)entities.push({kind:"enemy",x:430+(i%4)*42,y:experience==="platformer"?320:130+Math.floor(i/4)*46,width:30,height:30});
 for(let i=0;i<parsed.entities.obstacles;i++)entities.push({kind:"obstacle",x:260+(i%5)*58,y:experience==="platformer"?330:270+Math.floor(i/5)*42,width:34,height:34});
 if(parsed.objective==="reach-portal")entities.push({kind:"portal",x:570,y:experience==="platformer"?310:330,width:34,height:54});
 return{id:`manifest-${Date.now()}`,kind:"interactive-experience",runtime:"phaser",framework:"react",title,experience,objective:parsed.objective,camera:parsed.camera,controls:{horizontal:true,vertical:experience!=="platformer",jump:experience==="platformer"},scene:{key:"ManifestationScene",background:experience==="top-down"?0x08121a:experience==="platformer"?0x070b0e:0x0b1010,entities}};
}
