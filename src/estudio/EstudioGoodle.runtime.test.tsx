import { describe,expect,it,vi } from "vitest";
import { act,create } from "react-test-renderer";

vi.mock("../runtime/PhaserManifestation", () => ({
  PhaserManifestation: () => null,
}));

import { EstudioGoodle } from "./EstudioGoodle";

describe("Goodle Browser runtime flow",()=>{
 it("moves from intent to running to manifested result",()=>{
  vi.useFakeTimers();
  let root:any;
  act(()=>{root=create(<EstudioGoodle/>)});
  const input=root.root.findByProps({placeholder:"Crie qualquer coisa..."});
  act(()=>input.props.onChange({target:{value:"Crie um jogo de plataforma"}}));
  act(()=>input.props.onKeyDown({key:"Enter",preventDefault:()=>{}}));
  const execute=root.root.findAllByType("button").find((b:any)=>String(b.props.children).includes("Executar"));
  act(()=>execute.props.onClick());
  expect(JSON.stringify(root.toJSON())).toContain("Executando");
  act(()=>vi.runAllTimers());
  const output=JSON.stringify(root.toJSON());
  expect(output).toContain("Manifestado");
  expect(output).toContain("Crie um jogo de plataforma");
  vi.useRealTimers();
 });
});
