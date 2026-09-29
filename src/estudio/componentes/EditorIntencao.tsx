const exemplo = `quando player entrar na cidade:\n  se player tem chave:\n    abrir portal\n  else:\n    show Você precisa da chave.`;

export function EditorIntencao() {
  return (
    <aside className="coluna-criacao">
      <section className="painel editor">
        <div className="titulo-painel">OldRewrite</div>
        <pre>{exemplo}</pre>
      </section>

      <section className="painel good-ai">
        <div className="titulo-painel">Good — THE AI</div>
        <p>Descreva o que você quer criar.</p>
        <textarea aria-label="Intenção" defaultValue="Crie um RPG com uma cidade e um portal." />
        <button type="button">Gerar proposta</button>
      </section>
    </aside>
  );
}
