import { CanvasDemonstracao } from "../../ui/goodle/CanvasDemonstracao";
import { useManifestationRegistry } from "../chronicle/ManifestationRegistry";

export function Previa() {
  const { manifestations, selectManifestation } = useManifestationRegistry();
  return (
    <section className="painel previa" aria-label="Prévia">
      <div className="titulo-painel">
        <span>Prévia</span>
        <span>{manifestations.length} manifestação(ões)</span>
      </div>
      <CanvasDemonstracao />
      {manifestations.length > 0 && (
        <nav className="manifestation-list" aria-label="Manifestações">
          {manifestations.map(({ artifact }) => (
            <button
              type="button"
              key={artifact.artifact.artifact_id}
              onClick={() => selectManifestation(artifact.artifact.artifact_id)}
            >
              <strong>{artifact.artifact.kind}</strong>
              <span>{artifact.artifact.artifact_id}</span>
              <small>{artifact.artifact.authority}</small>
            </button>
          ))}
        </nav>
      )}
    </section>
  );
}
