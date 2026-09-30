import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GoodleMark } from "../ui/goodle";

describe("Goodle approved brand shell", () => {
  it("renders the four semantic brand facets", () => {
    const html = renderToStaticMarkup(<GoodleMark />);
    expect(html).toContain("goodle-mark__intention");
    expect(html).toContain("goodle-mark__knowledge");
    expect(html).toContain("goodle-mark__action");
    expect(html).toContain("goodle-mark__manifestation");
  });
});
