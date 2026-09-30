type EditorIntencaoProps = {
  oldRewrite: string;
  naturalIntent: string;
  onOldRewriteChange: (value: string) => void;
  onNaturalIntentChange: (value: string) => void;
};

export function EditorIntencao({ oldRewrite, naturalIntent, onOldRewriteChange, onNaturalIntentChange }: EditorIntencaoProps) {
  return (
    <aside className="coluna-criacao">
      <section className="painel editor">
        <div className="titulo-painel">OldRewrite</div>
        <textarea
          aria-label="OldRewrite"
          value={oldRewrite}
          onChange={(event) => onOldRewriteChange(event.target.value)}
        />
      </section>

      <section className="painel good-ai">
        <div className="titulo-painel">Good — THE AI</div>
        <p>Descreva o que você quer criar.</p>
        <textarea
          aria-label="Intenção"
          value={naturalIntent}
          onChange={(event) => onNaturalIntentChange(event.target.value)}
        />
        <button type="button">Gerar proposta</button>
      </section>
    </aside>
  );
}
