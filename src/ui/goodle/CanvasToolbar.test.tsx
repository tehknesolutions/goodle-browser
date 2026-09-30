import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GoodleCanvasToolbar } from "./CanvasToolbar";

describe("GoodleCanvasToolbar", () => {
  it("exposes selection, pan, zoom and fit controls", () => {
    const html = renderToStaticMarkup(<GoodleCanvasToolbar zoom={100} tool="select" onToolChange={vi.fn()} onZoomChange={vi.fn()} onFit={vi.fn()} />);
    expect(html).toContain("Selecionar");
    expect(html).toContain("Mover");
    expect(html).toContain("100%");
    expect(html).toContain("Ajustar");
  });
});
