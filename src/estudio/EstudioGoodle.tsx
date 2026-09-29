import { Previa } from "./componentes/Previa";
import { EditorIntencao } from "./componentes/EditorIntencao";
import { PainelComponentes } from "./componentes/PainelComponentes";

export function EstudioGoodle() {
  return (
    <main className="estudio">
      <header className="cabecalho">
        <div className="marca">
          <strong>GoodStudio</strong>
          <span>Meu RPG</span>
        </div>
        <div className="acoes-cabecalho">
          <button type="button">▶ Executar</button>
          <span>☁ Salvo</span>
          <span className="avatar">MIG</span>
        </div>
      </header>

      <section className="grade-estudio">
        <PainelComponentes />
        <Previa />
        <EditorIntencao />
      </section>

      <footer className="barra-status">
        <span>● GoodRuntime</span>
        <span>React + Phaser + Backend</span>
        <span>0 erros</span>
      </footer>
    </main>
  );
}
