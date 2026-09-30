import { useState } from "react";
import { Previa } from "./componentes/Previa";
import { EditorIntencao } from "./componentes/EditorIntencao";
import { PainelComponentes, type SecaoGoodStudio } from "./componentes/PainelComponentes";
import { ChronicleProvider } from "./chronicle/ChronicleStore";
import { ManifestationRegistryProvider } from "./chronicle/ManifestationRegistry";
import { createStudioDraft, updateStudioDraft } from "./StudioDraftState";
import { GoodleButton, GoodleCommandBar, GoodleMark } from "../ui/goodle";

type Espaco = "studio" | "funspace";
export function EstudioGoodle(){
 const[draft,setDraft]=useState(createStudioDraft),[espaco,setEspaco]=useState<Espaco>("studio"),[secao,setSecao]=useState<SecaoGoodStudio>("Início"),[estado,setEstado]=useState("Pronto para criar"),[ultimaIntencao,setUltimaIntencao]=useState("");
 function criar(intencao:string){setEstado("Processando intenção…");setUltimaIntencao(intencao);setDraft(c=>updateStudioDraft(c,{naturalIntent:intencao}));window.setTimeout(()=>setEstado("Intenção aplicada ao workspace local"),180)}
 function executar(){setEstado(ultimaIntencao||draft.naturalIntent?"Runtime local preparado":"Adicione uma intenção antes de executar")}
 return <ChronicleProvider><ManifestationRegistryProvider><main className="estudio">
  <header className="cabecalho"><div className="marca"><GoodleMark/><div className="marca__word"><strong>goodle<sup>®</sup></strong><span>CREATE ANYTHING</span></div></div><GoodleCommandBar placeholder="Crie qualquer coisa..." onSubmit={criar}/><div className="acoes-cabecalho"><button className="icon-action" type="button" aria-label="Configurações">⚙</button><GoodleButton variant="primary" type="button" onClick={executar}>▶ Executar</GoodleButton><span className="avatar"><GoodleMark/></span></div></header>
  <div className="browser-modebar"><button className={`browser-mode${espaco==="studio"?" browser-mode--active":""}`} onClick={()=>setEspaco("studio")}>Projeto</button><button className={`browser-mode${espaco==="funspace"?" browser-mode--active":""}`} onClick={()=>setEspaco("funspace")}>FunSpace</button><span className="browser-mode-hint">{estado}</span></div>
  {espaco==="studio"?<section className="grade-estudio"><PainelComponentes ativa={secao} onSelect={n=>{setSecao(n);setEstado(`${n} aberto`)}}/><div className="workspace-stack"><div className="workspace-context"><span>Canvas · {secao}</span>{ultimaIntencao&&<strong>◆ {ultimaIntencao}</strong>}</div><Previa/></div><EditorIntencao oldRewrite={draft.oldRewrite} naturalIntent={draft.naturalIntent} onOldRewriteChange={v=>setDraft(c=>updateStudioDraft(c,{oldRewrite:v}))} onNaturalIntentChange={v=>setDraft(c=>updateStudioDraft(c,{naturalIntent:v}))}/></section>:<section className="funspace-workspace"><div className="funspace-orbit"><GoodleMark/></div><span className="funspace-kicker">FUNSPACE</span><h1>Crie, explore e teste experiências.</h1><p>Um espaço vivo para experimentar ideias antes de manifestá-las no projeto.</p><div className="funspace-actions"><GoodleButton variant="primary" onClick={()=>setEspaco("studio")}>Manifestar</GoodleButton><GoodleButton onClick={()=>setEstado("FunSpace pronto")}>+ Nova experiência</GoodleButton></div>{ultimaIntencao&&<div className="funspace-intent"><small>INTENÇÃO</small><strong>{ultimaIntencao}</strong></div>}</section>}
  <footer className="barra-status"><span className="status-manifest">●</span><span>{espaco==="studio"?`Canvas · ${secao}`:"FunSpace"}</span><span>Goodle Runtime</span><span>React + Phaser</span></footer>
 </main></ManifestationRegistryProvider></ChronicleProvider>
}
