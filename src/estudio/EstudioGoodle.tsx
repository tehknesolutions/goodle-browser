import { useState } from "react";
import { Previa } from "./componentes/Previa";
import { EditorIntencao } from "./componentes/EditorIntencao";
import { PainelComponentes, type SecaoGoodStudio } from "./componentes/PainelComponentes";
import { ChronicleProvider } from "./chronicle/ChronicleStore";
import { ManifestationRegistryProvider } from "./chronicle/ManifestationRegistry";
import { createStudioDraft, updateStudioDraft } from "./StudioDraftState";
import { GoodleButton, GoodleCommandBar, GoodleMark } from "../ui/goodle";

type Espaco = "studio" | "funspace";

export function EstudioGoodle() {
  const [draft, setDraft] = useState(createStudioDraft);
  const [espaco, setEspaco] = useState<Espaco>("studio");
  const [secao, setSecao] = useState<SecaoGoodStudio>("Início");
  const [estado, setEstado] = useState("Pronto para criar");
  const [ultimaIntencao, setUltimaIntencao] = useState("");

  function criar(intencao: string) {
    setEstado("Processando intenção…");
    setUltimaIntencao(intencao);
    setDraft((current) => updateStudioDraft(current, { naturalIntent: intencao }));
    window.setTimeout(() => setEstado("Intenção aplicada ao workspace local"), 180);
  }

  function executar() {
    setEstado(ultimaIntencao || draft.naturalIntent ? "Runtime local preparado · HNK-VERSE externo não solicitado" : "Adicione uma intenção antes de executar");
  }

  return (
    <ChronicleProvider>
      <ManifestationRegistryProvider>
        <main className="estudio">
          <header className="cabecalho">
            <div className="marca">
              <GoodleMark />
              <div className="marca__word"><strong>goodle<sup>®</sup></strong><span>Browser</span></div>
            </div>
            <GoodleCommandBar placeholder="Alef · Crie qualquer coisa..." onSubmit={criar} />
            <div className="acoes-cabecalho">
              <GoodleButton variant="primary" type="button" onClick={executar}>▶ Executar</GoodleButton>
              <span className="runtime-state">● {estado}</span>
              <span className="avatar">MIG</span>
            </div>
          </header>

          <div className="browser-modebar" role="navigation" aria-label="Espaços do Goodle">
            <button type="button" className={`browser-mode${espaco === "studio" ? " browser-mode--active" : ""}`} onClick={() => setEspaco("studio")}>GoodStudio</button>
            <button type="button" className={`browser-mode browser-mode--fun${espaco === "funspace" ? " browser-mode--active" : ""}`} onClick={() => setEspaco("funspace")}>✦ FunSpace</button>
            <span className="browser-mode-hint">{espaco === "studio" ? `${secao} · construir e manifestar` : "explorar · brincar · testar · manifestar"}</span>
          </div>

          {espaco === "studio" ? (
            <section className="grade-estudio">
              <PainelComponentes ativa={secao} onSelect={(nova) => { setSecao(nova); setEstado(`${nova} aberto`); }} />
              <div className="workspace-stack">
                <div className="workspace-context"><span>GoodStudio / {secao}</span>{ultimaIntencao && <strong>✦ {ultimaIntencao}</strong>}</div>
                <Previa />
              </div>
              <EditorIntencao
                oldRewrite={draft.oldRewrite}
                naturalIntent={draft.naturalIntent}
                onOldRewriteChange={(oldRewrite) => setDraft((current) => updateStudioDraft(current, { oldRewrite }))}
                onNaturalIntentChange={(naturalIntent) => setDraft((current) => updateStudioDraft(current, { naturalIntent }))}
              />
            </section>
          ) : (
            <section className="funspace-workspace">
              <div className="funspace-orbit" aria-hidden="true"><GoodleMark /></div>
              <span className="funspace-kicker">FUNSPACE</span>
              <h1>Um espaço para experimentar sem quebrar a criação.</h1>
              <p>Explore ideias, protótipos, mundos e interações. Quando uma intenção estiver pronta, leve-a ao GoodStudio para construção.</p>
              <div className="funspace-actions">
                <GoodleButton variant="primary" type="button" onClick={() => setEspaco("studio")}>Manifestar no GoodStudio</GoodleButton>
                <GoodleButton type="button" onClick={() => setEstado("FunSpace pronto para receber uma intenção pelo Alef")}>Nova experiência</GoodleButton>
              </div>
              {ultimaIntencao && <div className="funspace-intent"><small>INTENÇÃO ATIVA</small><strong>{ultimaIntencao}</strong></div>}
            </section>
          )}

          <footer className="barra-status">
            <span>● GoodRuntime</span><span>{espaco === "studio" ? `GoodStudio · ${secao}` : "FunSpace"}</span><span>React + Phaser ready</span><span>HNK-VERSE · externo</span>
          </footer>
        </main>
      </ManifestationRegistryProvider>
    </ChronicleProvider>
  );
}
