import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GoodleButton } from "./Button";
import { GoodleSemanticIcon } from "./SemanticIcon";
import { GoodleStatus } from "./Status";

describe("Goodle official design system", () => {
  it("renders all four semantic icon families", () => {
    for (const tone of ["intention", "knowledge", "action", "manifestation"] as const) {
      const html = renderToStaticMarkup(<GoodleSemanticIcon tone={tone} />);
      expect(html).toContain(`goodle-semantic-icon--${tone}`);
    }
  });

  it("allows semantic buttons without replacing interaction variants", () => {
    const html = renderToStaticMarkup(<GoodleButton semantic="action">Executar</GoodleButton>);
    expect(html).toContain("goodle-button--semantic-action");
  });

  it("supports semantic runtime status", () => {
    const html = renderToStaticMarkup(<GoodleStatus label="Manifestado" tone="manifestation" />);
    expect(html).toContain("goodle-status--manifestation");
  });
});
