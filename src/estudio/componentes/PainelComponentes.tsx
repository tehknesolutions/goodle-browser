const secoes = [
  "Início",
  "FunSpace",
  "Interface",
  "Mundo",
  "Componentes",
  "Dados",
  "Lógica",
  "Backend",
  "Segurança",
];

export function PainelComponentes() {
  return (
    <aside className="painel projeto" aria-label="Projeto">
      <div className="titulo-painel">Projeto</div>
      <nav>
        {secoes.map((secao) => (
          <button
            className={`item-navegacao${secao === "FunSpace" ? " item-navegacao--funspace" : ""}`}
            key={secao}
            type="button"
          >
            {secao}
          </button>
        ))}
      </nav>
    </aside>
  );
}
