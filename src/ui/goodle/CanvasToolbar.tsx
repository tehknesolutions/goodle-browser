export type GoodleCanvasTool = "select" | "pan";

type Props = { zoom:number; tool:GoodleCanvasTool; onToolChange:(tool:GoodleCanvasTool)=>void; onZoomChange:(zoom:number)=>void; onFit:()=>void };
export function GoodleCanvasToolbar({zoom,tool,onToolChange,onZoomChange,onFit}:Props){
 const clamp=(value:number)=>Math.min(200,Math.max(25,value));
 return <div className="goodle-canvas-toolbar" role="toolbar" aria-label="Controles do Canvas">
  <button type="button" className={tool==="select"?"is-active":""} onClick={()=>onToolChange("select")} title="Selecionar">⌁ <span>Selecionar</span></button>
  <button type="button" className={tool==="pan"?"is-active":""} onClick={()=>onToolChange("pan")} title="Mover">✥ <span>Mover</span></button>
  <i/>
  <button type="button" onClick={()=>onZoomChange(clamp(zoom-10))} aria-label="Diminuir zoom">−</button>
  <output aria-label="Zoom atual">{zoom}%</output>
  <button type="button" onClick={()=>onZoomChange(clamp(zoom+10))} aria-label="Aumentar zoom">+</button>
  <button type="button" onClick={onFit} title="Ajustar ao conteúdo">⊙ <span>Ajustar</span></button>
 </div>
}
