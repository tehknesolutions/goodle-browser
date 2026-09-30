import type {ManifestationEntity} from "./ManifestationArtifact";
import type {WorldTheme} from "./WorldIntentProfile";
export type RenderShape="character"|"creature"|"platform"|"prop"|"portal";
export type RenderDescriptor={shape:RenderShape;decoration:string;animated:boolean;emissive:boolean};
export function createRenderDescriptor(kind:ManifestationEntity["kind"],theme:WorldTheme):RenderDescriptor{if(kind==="player")return{shape:"character",decoration:"hero",animated:true,emissive:false};if(kind==="enemy")return{shape:"creature",decoration:`${theme}-enemy`,animated:true,emissive:false};if(kind==="portal")return{shape:"portal",decoration:`${theme}-gateway`,animated:true,emissive:true};if(kind==="platform")return{shape:"platform",decoration:`${theme}-ground`,animated:false,emissive:false};const decoration=theme==="forest"?"tree":theme==="desert"?"rock":theme==="ice"?"crystal":theme==="space"?"asteroid":"monolith";return{shape:"prop",decoration,animated:false,emissive:theme==="ice"}}
