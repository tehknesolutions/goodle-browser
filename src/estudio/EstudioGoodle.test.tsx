import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("../runtime/PhaserManifestation", () => ({
  PhaserManifestation: () => null,
}));

import { EstudioGoodle } from "./EstudioGoodle";

describe("EstudioGoodle", () => {
  it("expõe as áreas principais do shell em PT-BR", () => {
    const html = renderToStaticMarkup(<EstudioGoodle />);

    expect(html).toContain("GoodStudio");
    expect(html).toContain("Projeto");
    expect(html).toContain("Prévia");
    expect(html).toContain("OldRewrite");
    expect(html).toContain("Good — THE AI");
    expect(html).toContain("GoodRuntime");
  });
});
