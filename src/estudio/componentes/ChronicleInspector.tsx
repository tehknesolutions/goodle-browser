import type { Chronicle, ChronicleStage } from "../../nucleo/lineage/Chronicle";

const LABELS: Record<ChronicleStage, string> = {
  intent: "Alef / Intent",
  semantic_graph: "Semantic Graph",
  hom: "HOM",
  hnk_ir: "HNK-IR",
  verse_plan: "Verse Plan",
  execution: "Execution",
  artifact: "Artifact",
};

export function ChronicleInspector({ chronicle }: { chronicle?: Chronicle }) {
  if (!chronicle) {
    return (
      <aside className="chronicle-inspector" aria-label="Chronicle Inspector">
        <header><strong>Chronicle</strong><span>Sem manifestação selecionada</span></header>
      </aside>
    );
  }

  return (
    <aside className="chronicle-inspector" aria-label="Chronicle Inspector">
      <header>
        <strong>Chronicle</strong>
        <span className={chronicle.complete ? "chronicle-ok" : "chronicle-gap"}>
          {chronicle.complete ? "Lineage completo" : `${chronicle.missing.length} gaps`}
        </span>
      </header>
      <ol className="chronicle-flow">
        {[...chronicle.entries].reverse().map((entry) => (
          <li key={`${entry.stage}:${entry.ref}`} data-stage={entry.stage}>
            <span className="chronicle-node">{LABELS[entry.stage]}</span>
            <code>{entry.ref}</code>
            {entry.parent_refs.length > 0 && <small>{entry.parent_refs.length} vínculo(s)</small>}
          </li>
        ))}
      </ol>
      {chronicle.missing.length > 0 && (
        <section className="chronicle-unresolved" aria-label="Lineage gaps">
          <strong>UNRESOLVED</strong>
          {chronicle.missing.map((stage) => <span key={stage}>{LABELS[stage]}</span>)}
        </section>
      )}
    </aside>
  );
}
