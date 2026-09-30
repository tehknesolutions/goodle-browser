import { GoodleCanvas, GoodleConnection, GoodleNode } from "./index";

export function CanvasDemonstracao() {
  return (
    <GoodleCanvas>
      <div className="goodle-demo-flow" aria-label="Fluxo visual Goodle">
        <div className="goodle-demo-node goodle-demo-node--intention">
          <GoodleNode title="Intenção" type="PROMPT" tone="intention">
            Crie um RPG com cidade e portal.
          </GoodleNode>
        </div>

        <div className="goodle-demo-connection goodle-demo-connection--one">
          <GoodleConnection tone="knowledge" label="interpretar" />
        </div>

        <div className="goodle-demo-node goodle-demo-node--knowledge">
          <GoodleNode title="Goodle IR" type="KNOWLEDGE" tone="knowledge" selected>
            Cidade + Portal + Regra de acesso
          </GoodleNode>
        </div>

        <div className="goodle-demo-connection goodle-demo-connection--two">
          <GoodleConnection tone="action" label="executar" />
        </div>

        <div className="goodle-demo-node goodle-demo-node--action">
          <GoodleNode title="Execute" type="ACTION" tone="action">
            Build → Runtime
          </GoodleNode>
        </div>

        <div className="goodle-demo-connection goodle-demo-connection--three">
          <GoodleConnection tone="manifestation" label="manifestar" />
        </div>

        <div className="goodle-demo-node goodle-demo-node--manifestation">
          <GoodleNode title="Preview" type="MANIFESTATION" tone="manifestation">
            Mundo jogável
          </GoodleNode>
        </div>
      </div>
    </GoodleCanvas>
  );
}
