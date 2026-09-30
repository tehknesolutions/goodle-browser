import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../runtime/PhaserManifestation", () => ({
  PhaserManifestation: () => null,
}));

import { EstudioGoodle } from "./EstudioGoodle";

describe("EstudioGoodle", () => {
  it("expõe as áreas principais do shell atual em PT-BR", () => {
    const html = renderToStaticMarkup(<EstudioGoodle />);

    expect(html).toContain("goodle");
    expect(html).toContain("Projeto");
    expect(html).toContain("FunSpace");
    expect(html).toContain("Crie qualquer coisa...");
    expect(html).toContain("Goodle Runtime");
    expect(html).toContain("React + Phaser");
  });
});
