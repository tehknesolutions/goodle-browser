import { GoodleSemanticIcon } from "./SemanticIcon";
import { GoodleStatus } from "./Status";

export type GoodleRunState="idle"|"running"|"manifested"|"error";
type Props={state:GoodleRunState;title?:string;detail?:string};
export function GoodleRunResult({state,title,detail}:Props){
 const content={idle:["Pronto para executar","A manifestação aparecerá aqui."],running:["Executando","Transformando intenção em resultado…"],manifested:[title||"Manifestação","Resultado criado com sucesso."],error:["Falha na execução","Revise a intenção ou o runtime."]} as const;
 const tone=state==="manifested"?"manifestation":state==="running"?"action":state==="error"?"error":"idle";
 return <section className={`goodle-run-result goodle-run-result--${state}`} aria-live="polite">
  <header><GoodleSemanticIcon tone={state==="manifested"?"manifestation":state==="running"?"action":"intention"}/><span>{state==="manifested"?"Manifestação":"Result / Run"}</span><GoodleStatus label={state==="manifested"?"Manifestado":state==="running"?"Executando":state==="error"?"Erro":"Idle"} tone={tone}/></header>
  <div><strong>{content[state][0]}</strong><p>{detail||content[state][1]}</p></div>
 </section>;
}
