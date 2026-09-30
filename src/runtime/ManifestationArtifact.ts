export type ExperienceKind="platformer"|"top-down"|"sandbox";
export type ManifestationEntity={kind:"player"|"platform"|"enemy"|"object";x:number;y:number;width:number;height:number};
export type ManifestationArtifact={id:string;kind:"interactive-experience";runtime:"phaser";framework:"react";title:string;experience:ExperienceKind;controls:{horizontal:boolean;vertical:boolean;jump:boolean};scene:{key:"ManifestationScene";background:number;entities:ManifestationEntity[]}};
export function compileManifestationArtifact(intent:string):ManifestationArtifact{
 const title=intent.trim()||"Untitled manifestation",q=title.toLowerCase();
 const experience:ExperienceKind=/plataforma|platformer|pular|jump/.test(q)?"platformer":/top[- ]?down|aventura|rpg|explora/.test(q)?"top-down":"sandbox";
 const entities:ManifestationEntity[]=[{kind:"player",x:120,y:220,width:28,height:36}];
 if(experience==="platformer")entities.push({kind:"platform",x:320,y:360,width:520,height:28},{kind:"platform",x:470,y:275,width:150,height:18});
 if(experience==="top-down")entities.push({kind:"object",x:340,y:190,width:54,height:54},{kind:"object",x:480,y:300,width:90,height:28});
 if(experience==="sandbox")entities.push({kind:"object",x:320,y:240,width:72,height:72},{kind:"object",x:470,y:310,width:110,height:24});
 if(/inimig|enemy|monstro|advers/.test(q))entities.push({kind:"enemy",x:500,y:experience==="platformer"?320:180,width:30,height:30});
 return{id:`manifest-${Date.now()}`,kind:"interactive-experience",runtime:"phaser",framework:"react",title,experience,controls:{horizontal:true,vertical:experience!=="platformer",jump:experience==="platformer"},scene:{key:"ManifestationScene",background:experience==="top-down"?0x08121a:experience==="platformer"?0x070b0e:0x0b1010,entities}};
}
