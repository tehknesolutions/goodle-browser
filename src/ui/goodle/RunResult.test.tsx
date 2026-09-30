import { describe,expect,it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GoodleRunResult } from "./RunResult";

describe("GoodleRunResult",()=>{
 it("represents idle, running and manifested runtime states",()=>{
  expect(renderToStaticMarkup(<GoodleRunResult state="idle"/>)).toContain("Pronto para executar");
  expect(renderToStaticMarkup(<GoodleRunResult state="running"/>)).toContain("Executando");
  const manifested=renderToStaticMarkup(<GoodleRunResult state="manifested" title="App criado" detail="React + Phaser"/>);
  expect(manifested).toContain("Manifestação");
  expect(manifested).toContain("App criado");
  expect(manifested).toContain("React + Phaser");
 });
});
