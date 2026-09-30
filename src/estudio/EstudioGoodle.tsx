import { useState } from "react";
import { Previa } from "./componentes/Previa";
import { EditorIntencao } from "./componentes/EditorIntencao";
import { PainelComponentes } from "./componentes/PainelComponentes";
import { ChronicleInspector } from "./componentes/ChronicleInspector";
import { ChronicleProvider } from "./chronicle/ChronicleStore";
import { ManifestationRegistryProvider } from "./chronicle/ManifestationRegistry";
import { createStudioDraft, updateStudioDraft } from "./StudioDraftState";
import { GoodleButton, GoodleCommandBar } from "../ui/goodle";

export function EstudioGoodle() {
  const [draft, setDraft] = useState(createStudioDraft);
  return (
    <ChronicleProvider>
      <ManifestationRegistryProvider>
        <main className="estudio">
          <header className="cabecalho">
            <div className="marca">
              <strong>goodle</strong>
              <span>GoodStudio</span>
            </div>
            <GoodleCommandBar placeholder="Crie qualquer coisa..." />
            <div className="acoes-cabecalho">
              <GoodleButton variant="primary" type="button">▶ Executar</GoodleButton>
              <span>● Salvo</span>
              <span className="avatar">MIG</span>
            </div>
          </header>

          <section className="grade-estudio">
            <PainelComponentes />
            <Previa />
            <EditorIntencao
              oldRewrite={draft.oldRewrite}
              naturalIntent={draft.naturalIntent}
              onOldRewriteChange={(oldRewrite) => setDraft((current) => updateStudioDraft(current, { oldRewrite }))}
              onNaturalIntentChange={(naturalIntent) => setDraft((current) => updateStudioDraft(current, { naturalIntent }))}
            />
          </section>

          <ChronicleInspector />

          <footer className="barra-status">
            <span>● GoodRuntime</span>
            <span>React + Phaser + Backend</span>
            <span>0 erros</span>
          </footer>
        </main>
      </ManifestationRegistryProvider>
    </ChronicleProvider>
  );
}
