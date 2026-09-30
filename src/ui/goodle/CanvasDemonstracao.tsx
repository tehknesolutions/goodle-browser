import { useState } from "react";
import { GoodleCanvas, GoodleCanvasToolbar, GoodleConnection, GoodleNode, type GoodleCanvasTool } from "./index";

export function CanvasDemonstracao() {
  const [zoom,setZoom]=useState(100);
  const [tool,setTool]=useState<GoodleCanvasTool>("select");
  return (
    <GoodleCanvas>
      <GoodleCanvasToolbar zoom={zoom} tool={tool} onToolChange={setTool} onZoomChange={setZoom} onFit={()=>setZoom(100)} />
      <div className={`goodle-demo-viewport goodle-demo-viewport--${tool}`}>
       <div className="goodle-demo-flow" style={{transform:`scale(${zoom/100})`}} aria-label="Fluxo Goodle: intenção, conhecimento, ação e manifestação">
        <div className="goodle-demo-node goodle-demo-node--intention"><GoodleNode title="Intenção" type="PROMPT / IDEIA" tone="intention">Crie qualquer coisa.</GoodleNode></div>
        <div className="goodle-demo-connection"><GoodleConnection tone="knowledge" /></div>
        <div className="goodle-demo-node goodle-demo-node--knowledge"><GoodleNode title="Conhecimento" type="COMPOSIÇÃO" tone="knowledge">Nodes / componentes</GoodleNode></div>
        <div className="goodle-demo-connection"><GoodleConnection tone="action" /></div>
        <div className="goodle-demo-node goodle-demo-node--action"><GoodleNode title="Ação" type="EXECUTAR" tone="action">Processo / comando</GoodleNode></div>
        <div className="goodle-demo-connection"><GoodleConnection tone="manifestation" /></div>
        <div className="goodle-demo-node goodle-demo-node--manifestation"><GoodleNode title="Manifestação" type="RESULTADO" tone="manifestation">Jogo / app / experiência</GoodleNode></div>
       </div>
      </div>
    </GoodleCanvas>
  );
}
