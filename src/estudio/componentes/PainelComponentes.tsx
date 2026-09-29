const secoes = ["Início", "Interface", "Mundo", "Componentes", "Dados", "Lógica", "Backend", "Assets", "Segurança"];

export function PainelComponentes() {
  return (
    <aside className="painel projeto" aria-label="Projeto">
      <div className="titulo-painel">Projeto</div>
      <nav>
        {secoes.map((secao) => (
          <button className="item-navegacao" key={secao} type="button">{secao}</button>
        ))}
      </nav>
    </aside>
  );
}
