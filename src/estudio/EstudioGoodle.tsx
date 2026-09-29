import { Previa } from "./componentes/Previa";
import { EditorIntencao } from "./componentes/EditorIntencao";
import { PainelComponentes } from "./componentes/PainelComponentes";

export function EstudioGoodle() {
  return (
    <main className="estudio">
      <header className="cabecalho">
        <strong>Goodle</strong>
        <span>Estúdio de criação</span>
      </header>

      <section className="grade-estudio">
        <PainelComponentes />
        <Previa />
        <EditorIntencao />
      </section>
    </main>
  );
}