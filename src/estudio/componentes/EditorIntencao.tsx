import { useState } from "react";

type EditorIntencaoProps = {
  oldRewrite: string;
  naturalIntent: string;
  onOldRewriteChange: (value: string) => void;
  onNaturalIntentChange: (value: string) => void;
};

type Mensagem = { autor: "Você" | "Good"; texto: string };

export function EditorIntencao({ oldRewrite, naturalIntent, onOldRewriteChange, onNaturalIntentChange }: EditorIntencaoProps) {
  const [mensagem, setMensagem] = useState("");
  const [conversa, setConversa] = useState<Mensagem[]>([]);

  function enviar() {
    const texto = mensagem.trim();
    if (!texto) return;
    setConversa((atual) => [
      ...atual,
      { autor: "Você", texto },
      { autor: "Good", texto: `Entendi a intenção no contexto atual: “${texto}”. O provedor remoto de IA ainda não está conectado; posso aplicar esta intenção localmente ao rascunho.` },
    ]);
    onNaturalIntentChange(texto);
    setMensagem("");
  }

  return (
    <aside className="coluna-criacao">
      <section className="painel editor">
        <div className="titulo-painel">Construção</div>
        <textarea aria-label="OldRewrite" value={oldRewrite} onChange={(event) => onOldRewriteChange(event.target.value)} />
      </section>

      <section className="painel good-ai">
        <div className="titulo-painel"><span>Good — THE AI</span><small>contextual · local</small></div>
        <div className="good-ai__conversation" aria-live="polite">
          {conversa.length === 0 ? <p>Converse com a Good sobre o que está criando.</p> : conversa.map((item, index) => (
            <div className={`good-ai__message good-ai__message--${item.autor === "Good" ? "good" : "user"}`} key={`${item.autor}-${index}`}>
              <strong>{item.autor}</strong><span>{item.texto}</span>
            </div>
          ))}
        </div>
        <textarea
          aria-label="Mensagem para Good AI"
          value={mensagem}
          onChange={(event) => setMensagem(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); enviar(); } }}
          placeholder={naturalIntent || "Peça uma alteração, ideia ou criação..."}
        />
        <button className="good-ai__send" type="button" onClick={enviar}>Enviar para Good</button>
      </section>
    </aside>
  );
}
