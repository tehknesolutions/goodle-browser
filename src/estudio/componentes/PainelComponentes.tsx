export const secoesGoodStudio = ["Início", "Interface", "Mundo", "Componentes", "Dados", "Lógica", "Backend", "Segurança"] as const;
export type SecaoGoodStudio = (typeof secoesGoodStudio)[number];

type PainelComponentesProps = {
  ativa: SecaoGoodStudio;
  onSelect: (secao: SecaoGoodStudio) => void;
};

export function PainelComponentes({ ativa, onSelect }: PainelComponentesProps) {
  return (
    <aside className="painel projeto" aria-label="Projeto">
      <div className="titulo-painel">Projeto</div>
      <nav>
        {secoesGoodStudio.map((secao) => (
          <button
            className={`item-navegacao${ativa === secao ? " is-active" : ""}`}
            aria-current={ativa === secao ? "page" : undefined}
            key={secao}
            type="button"
            onClick={() => onSelect(secao)}
          >
            {secao}
          </button>
        ))}
      </nav>
    </aside>
  );
}
