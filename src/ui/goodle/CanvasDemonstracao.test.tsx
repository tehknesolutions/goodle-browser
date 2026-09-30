import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CanvasDemonstracao } from "./CanvasDemonstracao";

describe("CanvasDemonstracao",()=>{
 it("mounts the official canvas toolbar and semantic flow",()=>{
  const html=renderToStaticMarkup(<CanvasDemonstracao/>);
  expect(html).toContain("Controles do Canvas");
  expect(html).toContain("Intenção");
  expect(html).toContain("Manifestação");
  expect(html).toContain("100%");
 });
});
